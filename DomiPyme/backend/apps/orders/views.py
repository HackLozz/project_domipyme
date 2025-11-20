from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import CheckoutSerializer
from .models import Order, OrderItem
from apps.shops.models import Product, Shop
from decimal import Decimal
from django.db import transaction

class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def post(self, request):
        """
        Recibe:
        { "items": [ { product, qty }, ... ] }
        - Recalcula precios desde DB (product.price).
        - Valida stock.
        - Agrupa items por shop y crea 1 Order por shop.
        - No decrementa stock (se hace al confirmar pago vía webhook).
        - Retorna lista de órdenes con `payment_url` (sandbox).
        """
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items = serializer.validated_data.get("items", [])
        if not items:
            return Response({"detail": "Cart vacío"}, status=status.HTTP_400_BAD_REQUEST)

        # Cargar productos y validar existencia y stock
        product_map = {}
        for it in items:
            pid = it["product"]
            try:
                prod = Product.objects.select_related('shop').get(pk=pid)
            except Product.DoesNotExist:
                return Response({"detail": f"Producto {pid} no encontrado"}, status=status.HTTP_400_BAD_REQUEST)
            qty = it.get("qty", 1)
            if prod.stock < qty:
                return Response({"detail": f"Stock insuficiente para {prod.name}"}, status=status.HTTP_400_BAD_REQUEST)
            product_map[pid] = prod

        # Agrupar items por shop_id
        shops_items = {}
        for it in items:
            pid = it["product"]
            qty = it.get("qty", 1)
            prod = product_map[pid]
            shop_id = prod.shop.id
            shops_items.setdefault(shop_id, []).append({
                "product": prod,
                "qty": qty
            })

        created_orders = []

        # Para cada shop crea una order atómica
        for shop_id, shop_items in shops_items.items():
            shop = Shop.objects.get(pk=shop_id)
            with transaction.atomic():
                order = Order.objects.create(
                    customer=request.user if request.user.is_authenticated else None,
                    shop=shop,
                    total=Decimal("0.0"),
                    status="pending",
                    payment_confirmed=False
                )
                total = Decimal("0.0")
                for it in shop_items:
                    prod = it["product"]
                    qty = int(it["qty"])
                    price = Decimal(prod.price)  # price from DB
                    OrderItem.objects.create(
                        order=order,
                        product=prod,
                        price=price,
                        quantity=qty
                    )
                    total += (price * qty)
                order.total = total
                order.save()

                # Crear "payment_url" sandbox (en producción, invocar API del proveedor)
                payment_url = f"https://sandbox.payment.provider/pay?order_id={order.id}&amount={order.total}"
                created_orders.append({
                    "order_id": order.id,
                    "shop_id": shop.id,
                    "shop_name": shop.name,
                    "total": str(order.total),
                    "payment_url": payment_url
                })

        # Si solo hay una orden, devolvemos un objeto; si varias, lista (frontend debe manejar ambos casos)
        if len(created_orders) == 1:
            return Response(created_orders[0], status=status.HTTP_201_CREATED)
        return Response({"orders": created_orders}, status=status.HTTP_201_CREATED)
