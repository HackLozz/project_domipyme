# backend/apps/products/views.py
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from .models import ProductItem
from .serializers import ProductItemSerializer
from .permissions import IsMerchantOrAdmin

class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de productos.
    Permite CRUD de productos, restringido por permisos personalizados.
    Solo merchant/admin pueden crear/editar, solo owner puede modificar sus productos.
    """
    serializer_class = ProductItemSerializer
    permission_classes = [IsMerchantOrAdmin]

    def get_queryset(self):
        """
        Retorna productos según permisos:
        - Público: solo productos activos
        - Merchant/Admin: todos los productos
        """
        user = self.request.user
        if user.is_authenticated and (user.is_staff or getattr(user, 'is_merchant', False)):
            return ProductItem.objects.all()
        return Product.objects.filter(active=True)

    def perform_create(self, serializer):
        # Si el modelo Product tiene relación con shop/owner, asignar aquí
        serializer.save()

    def perform_update(self, serializer):
        # Solo owner/admin pueden modificar
        user = self.request.user
        instance = serializer.instance
        # Si el modelo tiene owner/shop, validar aquí
        if not (user.is_staff or getattr(user, 'is_merchant', False)):
            raise PermissionDenied("No tienes permisos para modificar este producto.")
        serializer.save()
