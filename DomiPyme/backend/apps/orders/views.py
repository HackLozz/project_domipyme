from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import CheckoutSerializer
from .models import Order, OrderItem
from apps.shops.models import Product, Shop
from decimal import Decimal

class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def post(self, request):
        """
        Accepts:
        { "items": [ { product, price, qty }, ... ] }
        Creates Order + OrderItems and returns a 'payment_url' (sandbox) or confirmation.
        """
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        items = data["items"]
        if not items:
            return Response({"detail":"Cart vacío"}, status=status.HTTP_400_BAD_REQUEST)

        # Determine shop: assume all items from same shop (MVP). If not, later split into multiple orders.
        # Try to infer shop_id from first product
        try:
            first_product = Product.objects.get(pk=items[0]["product"])
            shop = first_product.shop
        except Product.DoesNotExist:
            return Response({"detail":"Producto no encontrado"}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(customer=request.user if request.user.is_authenticated else None,
                                     shop=shop, total=Decimal("0.0"))
        total = Decimal("0.0")
        for it in items:
            try:
                prod = Product.objects.get(pk=it["product"])
            except Product.DoesNotExist:
                order.delete()
                return Response({"detail":f"Producto {it['product']} no existe"}, status=status.HTTP_400_BAD_REQUEST)
            qty = it.get("qty",1)
            price = Decimal(it["price"])
            OrderItem.objects.create(order=order, product=prod, price=price, quantity=qty)
            total += price * qty

        order.total = total
        order.save()

        # For MVP: create a fake payment URL (in production: call PayU/MP/Stripe)
        payment_url = f"https://sandbox.payment.provider/pay?order_id={order.id}&amount={order.total}"

        return Response({
            "order_id": order.id,
            "total": str(order.total),
            "payment_url": payment_url
        }, status=status.HTTP_201_CREATED)
