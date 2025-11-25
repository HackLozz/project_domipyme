# backend/apps/shops/views.py
from rest_framework import viewsets, generics, permissions, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.apps import apps
from django.db import models
from django.shortcuts import get_object_or_404

from .models import Shop, Product as ShopProduct  # modelos propios de apps.shops
from .serializers import ShopSerializer, ShopDetailSerializer, ProductSerializer
from apps.products.permissions import IsMerchantOrAdmin  # permiso defensivo ya creado


# --- Compatibilidad: tus vistas genéricas previas (se mantienen) ---
class ShopListCreateView(generics.ListCreateAPIView):
    """
    Mantener la vista existente por compatibilidad (si hay imports directos en tests o código).
    """
    queryset = Shop.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = ShopSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ShopDetailView(generics.RetrieveAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopDetailSerializer
    lookup_field = "slug"


# --- Nuevos ViewSets (usados por el router y por las rutas nombradas) ---
class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.all().order_by('-created_at')
    serializer_class = ShopSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet para Products usando el modelo de apps.shops.Product.
    Lectura pública; escritura restringida por IsMerchantOrAdmin.
    """
    # Intentamos usar el modelo de shops directamente
    try:
        Product = apps.get_model('shops', 'Product')
    except LookupError:
        Product = ShopProduct  # fallback al import directo

    serializer_class = ProductSerializer
    permission_classes = [IsMerchantOrAdmin]

    def get_queryset(self):
        qs = self.Product.objects.filter(active=True).order_by('-created_at')

        # Optimización: si existe FK shop, hacemos select_related
        # comprobamos campos del modelo
        field_names = {f.name for f in self.Product._meta.get_fields()}
        if 'shop' in field_names:
            try:
                qs = qs.select_related('shop')
            except Exception:
                # si por alguna razón select_related falla, devolvemos sin optimizar
                pass

        # Soportar filtro por shop via query param ?shop=ID
        shop_id = self.request.query_params.get('shop')
        if shop_id:
            qs = qs.filter(shop_id=shop_id)

        return qs

    def perform_create(self, serializer):
        """
        Validación adicional: si el usuario es merchant, asegurar que asigna un shop
        que realmente le pertenezca (propiedad). Si intenta crear en shop que no
        le pertenece, denegamos.
        """
        user = self.request.user
        shop = serializer.validated_data.get('shop', None)
        if shop and user and user.is_authenticated and not user.is_staff:
            # si shop.owner existe y no coincide con user, impedir creación
            owner = getattr(shop, 'owner', None)
            if owner and owner != user:
                raise permissions.PermissionDenied("No tienes permisos para crear productos en esta tienda.")
        serializer.save()

    def perform_update(self, serializer):
        # en update también validamos la propiedad si el campo shop está presente
        user = self.request.user
        shop = serializer.validated_data.get('shop', None)
        if shop and user and user.is_authenticated and not user.is_staff:
            owner = getattr(shop, 'owner', None)
            if owner and owner != user:
                raise permissions.PermissionDenied("No tienes permiso para mover este producto a esa tienda.")
        serializer.save()

    @action(detail=False, methods=['get'], url_path='slug/(?P<slug>[-a-zA-Z0-9_]+)')
    def retrieve_by_slug(self, request, slug=None):
        try:
            shop = Shop.objects.get(slug=slug)
        except Shop.DoesNotExist:
            return Response({"detail": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ShopSerializer(shop, context={'request': request})
        return Response(serializer.data)

