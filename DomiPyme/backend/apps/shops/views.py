# backend/apps/shops/views.py
from rest_framework import viewsets, generics, permissions, status
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
    """
    ViewSet para Shops (admin/merchant create/update/delete via permissions).
    Se asigna owner automáticamente en create.
    """
    queryset = Shop.objects.all().order_by('-created_at')
    serializer_class = ShopSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        # Para retrieve usamos detalle si existe
        if self.action == 'retrieve' and hasattr(self, 'serializer_class'):
            # comprobar si existe un serializer "detail"
            try:
                return ShopDetailSerializer
            except Exception:
                return self.serializer_class
        return self.serializer_class

    def perform_create(self, serializer):
        # Asigna owner automáticamente si hay user autenticado
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()


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

    @action(detail=False, methods=['get'], url_path='by-shop/(?P<slug>[-a-zA-Z0-9_]+)')
    def list_by_shop(self, request, slug=None):
        # Listar productos por shop slug
        shop = get_object_or_404(Shop, slug=slug)
        qs = self.get_queryset().filter(shop=shop)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
