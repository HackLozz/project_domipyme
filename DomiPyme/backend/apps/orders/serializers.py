from rest_framework import serializers
from .models import Order, OrderItem

class OrderItemInputSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    name = serializers.CharField(required=False)
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    qty = serializers.IntegerField(min_value=1)

class CheckoutSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True)
    shop_id = serializers.IntegerField(required=False)

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"
