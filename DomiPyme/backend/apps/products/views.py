# backend/apps/products/views.py
from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer
from .permissions import IsMerchantOrAdmin

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsMerchantOrAdmin]

    def get_queryset(self):
        # Lectura pública solo de productos activos
        return Product.objects.filter(active=True)
