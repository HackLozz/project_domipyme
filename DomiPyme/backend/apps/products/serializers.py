# backend/apps/products/serializers.py
from rest_framework import serializers
from .models import ProductItem
from apps.shops.models import Shop

class ProductItemSerializer(serializers.ModelSerializer):
    shop = serializers.PrimaryKeyRelatedField(queryset=Shop.objects.all())

    class Meta:
        model = ProductItem
        # ajusta fields si hay campos sensibles que no quieres exponer
        fields = [
            'id',
            'shop',
            'name',
            'slug',
            'description',
            'price',
            'stock',
            'active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("El nombre no puede estar vacío.")
        if len(value) < 3:
            raise serializers.ValidationError("El nombre debe tener al menos 3 caracteres.")
        return value

    def validate_description(self, value):
        value = value.strip()
        if len(value) > 1000:
            raise serializers.ValidationError("La descripción es demasiado larga.")
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a cero.")
        if value > 1000000:
            raise serializers.ValidationError("El precio excede el límite permitido.")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock no puede ser negativo.")
        if value > 100000:
            raise serializers.ValidationError("El stock excede el límite permitido.")
        return value

    def validate_shop(self, value):
        user = self.context['request'].user if 'request' in self.context else None
        if not value:
            raise serializers.ValidationError("La tienda es requerida.")
        if not user:
            raise serializers.ValidationError("Usuario no autenticado.")
        if not (user.is_staff or value.owner == user or getattr(user, 'is_merchant', False)):
            raise serializers.ValidationError("Solo el owner, merchant o admin pueden asociar productos a esta tienda.")
        return value
