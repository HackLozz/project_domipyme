from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from rest_framework.decorators import action
from .serializers import (
    CheckoutSerializer,
    OrderSerializer,
    CartSerializer,
    CartItemSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
)
from .models import Order, OrderItem, Cart, CartItem
from apps.shops.models import Product, Shop
from decimal import Decimal
from django.db import transaction
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

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


class MyOrdersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(customer=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, customer=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Orden no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MerchantMyOrdersView(APIView):
    """
    Retorna órdenes asociadas a tiendas cuyo owner es el usuario autenticado.
    Solo accesible para merchants o admins.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (getattr(user, 'is_staff', False) or getattr(user, 'is_merchant', False)):
            return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        shop_ids = list(Shop.objects.filter(owner=user).values_list('id', flat=True))
        orders = Order.objects.filter(shop_id__in=shop_ids).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MerchantOrdersStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (getattr(user, 'is_staff', False) or getattr(user, 'is_merchant', False)):
            return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        shop_ids = list(Shop.objects.filter(owner=user).values_list('id', flat=True))
        qs = Order.objects.filter(shop_id__in=shop_ids).order_by('-created_at')
        total = qs.count()
        pending = qs.filter(status='pending').count()
        approved = qs.filter(payment_confirmed=True).count()
        delivered = qs.filter(status='delivered').count()
        last_order_date = qs.first().created_at.isoformat() if qs.exists() else None

        from django.db.models import Sum
        revenue_total = qs.aggregate(s=Sum('total')).get('s') or 0
        revenue_approved = qs.filter(payment_confirmed=True).aggregate(s=Sum('total')).get('s') or 0

        return Response({
            'total': total,
            'pending': pending,
            'approved': approved,
            'delivered': delivered,
            'last_order_date': last_order_date,
            'revenue_total': str(revenue_total),
            'revenue_approved': str(revenue_approved),
        }, status=status.HTTP_200_OK)


class OrderStatusUpdateView(APIView):
    """
    PUT /api/orders/<id>/status/ {"status": "preparing"}
    Allowed transitions:
      pending -> paid|cancelled
      paid -> preparing|cancelled
      preparing -> dispatched|cancelled
      dispatched -> delivered
      delivered -> (no changes)
      cancelled -> (no changes)
    Permissions:
      - Admin can update any
      - Merchant can update orders belonging to their shops
    """
    permission_classes = [IsAuthenticated]

    ALLOWED_TRANSITIONS = {
        "pending": {"paid", "cancelled"},
        "paid": {"preparing", "cancelled"},
        "preparing": {"dispatched", "cancelled"},
        "dispatched": {"delivered"},
        "delivered": set(),
        "cancelled": set(),
    }

    def put(self, request, pk):
        new_status = (request.data.get("status") or "").strip()
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({"detail": "Estado inválido"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.select_related('shop').get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Orden no encontrada"}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        # Permission: admin or merchant owning the shop
        is_admin = getattr(user, 'is_staff', False)
        is_merchant = getattr(user, 'is_merchant', False)
        owns_shop = getattr(order.shop, 'owner_id', None) == getattr(user, 'id', None)
        if not (is_admin or (is_merchant and owns_shop)):
            return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        current = order.status
        allowed = self.ALLOWED_TRANSITIONS.get(current, set())
        if new_status not in allowed:
            return Response({"detail": f"Transición no permitida desde '{current}' a '{new_status}'"}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        # auto-set payment_confirmed if moving to paid
        if new_status == 'paid':
            order.payment_confirmed = True
        order.save()
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CartViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar el carrito de compras
    - Usuarios anónimos: usa session_key
    - Usuarios autenticados: usa user FK
    - Soporta merge de carrito anónimo al hacer login
    """
    serializer_class = CartSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """Obtener el carrito del usuario actual"""
        if self.request.user.is_authenticated:
            return Cart.objects.filter(user=self.request.user).prefetch_related('items__product')
        else:
            session_key = self.request.session.session_key
            if not session_key:
                self.request.session.create()
                session_key = self.request.session.session_key
            return Cart.objects.filter(session_key=session_key).prefetch_related('items__product')

    def get_or_create_cart(self):
        """Obtener o crear el carrito del usuario/sesión"""
        if self.request.user.is_authenticated:
            cart, created = Cart.objects.get_or_create(user=self.request.user)
        else:
            session_key = self.request.session.session_key
            if not session_key:
                self.request.session.create()
                session_key = self.request.session.session_key
            cart, created = Cart.objects.get_or_create(session_key=session_key)
        return cart

    def list(self, request, *args, **kwargs):
        """GET /api/cart/ - Obtener el carrito actual"""
        cart = self.get_or_create_cart()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='add-item')
    def add_item(self, request):
        """
        POST /api/cart/add-item/
        Body: {"product_id": 1, "quantity": 2}
        Agregar un producto al carrito o incrementar cantidad
        """
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']

        # Validar producto
        product = get_object_or_404(Product, id=product_id, active=True)

        # Validar stock
        if product.stock < quantity:
            return Response(
                {'detail': f'Stock insuficiente. Solo hay {product.stock} unidades disponibles'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart = self.get_or_create_cart()

        # Buscar si ya existe el item
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity, 'price_snapshot': product.price}
        )

        if not created:
            # Incrementar cantidad
            new_quantity = cart_item.quantity + quantity
            if new_quantity > product.stock:
                return Response(
                    {'detail': f'Stock insuficiente. Solo hay {product.stock} unidades disponibles'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.quantity = new_quantity
            cart_item.save()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['patch'], url_path='update-item/(?P<item_id>[^/.]+)')
    def update_item(self, request, item_id=None):
        """
        PATCH /api/cart/update-item/{item_id}/
        Body: {"quantity": 3}
        Actualizar la cantidad de un item (si quantity=0, elimina el item)
        """
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = self.get_or_create_cart()
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

        quantity = serializer.validated_data['quantity']

        if quantity == 0:
            # Eliminar item
            cart_item.delete()
        else:
            # Validar stock
            if quantity > cart_item.product.stock:
                return Response(
                    {'detail': f'Stock insuficiente. Solo hay {cart_item.product.stock} unidades disponibles'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.quantity = quantity
            cart_item.save()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], url_path='remove-item/(?P<item_id>[^/.]+)')
    def remove_item(self, request, item_id=None):
        """
        DELETE /api/cart/remove-item/{item_id}/
        Eliminar un item del carrito
        """
        cart = self.get_or_create_cart()
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        cart_item.delete()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='clear')
    def clear_cart(self, request):
        """
        POST /api/cart/clear/
        Vaciar el carrito
        """
        cart = self.get_or_create_cart()
        cart.clear()

        cart_serializer = CartSerializer(cart, context={'request': request})
        return Response(cart_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='merge-anonymous', permission_classes=[IsAuthenticated])
    def merge_anonymous(self, request):
        """
        POST /api/cart/merge-anonymous/
        Body: {"session_key": "abc123..."}
        Fusionar carrito anónimo con el carrito del usuario autenticado
        Usado al hacer login
        """
        session_key = request.data.get('session_key')
        if not session_key:
            return Response(
                {'detail': 'session_key es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener carrito del usuario autenticado
        user_cart, _ = Cart.objects.get_or_create(user=request.user)

        # Buscar carrito anónimo
        try:
            anonymous_cart = Cart.objects.get(session_key=session_key, user__isnull=True)
            # Fusionar carritos
            user_cart.merge_with(anonymous_cart)
        except Cart.DoesNotExist:
            # No hay carrito anónimo, no hacer nada
            pass

        cart_serializer = CartSerializer(user_cart, context={'request': request})
        return Response(cart_serializer.data, status=status.HTTP_200_OK)
