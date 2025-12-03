from rest_framework import serializers
from .models import Order, OrderItem, Cart, CartItem, Payment


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer para CartItem con información del producto"""
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    product_stock = serializers.IntegerField(source='product.stock', read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    current_price = serializers.DecimalField(
        source='product.price',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = CartItem
        fields = [
            'id',
            'product_id',
            'product_name',
            'product_image',
            'product_stock',
            'quantity',
            'price_snapshot',
            'current_price',
            'total_price',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'price_snapshot', 'created_at', 'updated_at']

    def get_product_image(self, obj):
        """Obtener la primera imagen del producto"""
        if obj.product and hasattr(obj.product, 'images'):
            first_image = obj.product.images.filter(is_primary=True).first()
            if not first_image:
                first_image = obj.product.images.first()
            if first_image and first_image.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_image.image.url)
                return first_image.image.url
        return None


class CartSerializer(serializers.ModelSerializer):
    """Serializer para Cart con items y totales"""
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = [
            'id',
            'user',
            'items',
            'total_items',
            'subtotal',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class AddToCartSerializer(serializers.Serializer):
    """Serializer para agregar un producto al carrito"""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    """Serializer para actualizar la cantidad de un item"""
    quantity = serializers.IntegerField(min_value=0)


class OrderItemInputSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    name = serializers.CharField(required=False)
    price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    qty = serializers.IntegerField(min_value=1)

class CheckoutSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True)
    shop_id = serializers.IntegerField(required=False)

class PaymentSerializer(serializers.ModelSerializer):
    """Serializer para Payment"""
    class Meta:
        model = Payment
        fields = [
            'id',
            'order',
            'payment_method',
            'status',
            'amount',
            'currency',
            'stripe_payment_intent_id',
            'stripe_client_secret',
            'transaction_id',
            'created_at',
            'updated_at',
            'paid_at',
        ]
        read_only_fields = [
            'id',
            'stripe_payment_intent_id',
            'stripe_client_secret',
            'transaction_id',
            'created_at',
            'updated_at',
            'paid_at',
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer para OrderItem con información del producto"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'price', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id',
            'customer',
            'shop',
            'total',
            'status',
            'payment_confirmed',
            'created_at',
            'items',
            'payment',
        ]
        read_only_fields = ['id', 'created_at']
