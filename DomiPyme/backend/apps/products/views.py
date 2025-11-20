# backend/apps/products/views.py
from rest_framework import viewsets, permissions
from .models import Product
from .serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(active=True)
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['create','update','partial_update','destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]
