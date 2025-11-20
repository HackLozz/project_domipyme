# backend/apps/products/serializers.py
from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        # ajusta fields si hay campos sensibles que no quieres exponer
        fields = [
            'id',
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
