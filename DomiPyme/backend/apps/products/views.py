from rest_framework import viewsets, permissions
from .models import Product
from .serializers import ProductSerializer
from .permissions import IsMerchantOrAdmin

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()  # mostrar todo (filter activo en list o serializer)
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs = Product.objects.filter(active=True)
        # Si quieres permitir a merchants ver sus propios productos (incl. inactivos) podrías:
        # if self.request.user.is_authenticated and getattr(self.request.user, 'is_merchant', False):
        #     return Product.objects.filter(merchant__user=self.request.user)
        return qs

    permission_classes = [IsMerchantOrAdmin]
