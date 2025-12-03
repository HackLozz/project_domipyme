from rest_framework import viewsets, generics, permissions, status, exceptions
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.apps import apps
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from django.utils.text import slugify

from .models import Shop, Product as ShopProduct
from .serializers import ShopSerializer, ProductSerializer
from apps.products.permissions import IsMerchantOrAdmin
from .permissions import IsShopOwnerOrReadOnly, IsProductShopOwnerOrReadOnly

# ----- Resolver modelo Product de forma robusta -----
try:
    ProductModel = apps.get_model('shops', 'Product')
except LookupError:
    ProductModel = ShopProduct


class ShopListCreateView(generics.ListCreateAPIView):
    serializer_class = ShopSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """
        Por defecto listamos sólo shops activas.
        Los staff pueden ver todas si lo desean.
        Optimización: select_related('owner') para evitar N+1.
        """
        qs = Shop.objects.select_related('owner').order_by('-created_at')
        user = self.request.user
        if not (user and user.is_authenticated and user.is_staff):
            qs = qs.filter(active=True)
        
        # Search filter (name or description)
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
        
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Creación idempotente respecto a slug: si slug existe devolvemos el objeto existente (200).
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except IntegrityError:
            requested_slug = request.data.get('slug')
            if not requested_slug:
                requested_slug = slugify(request.data.get('name', ''))[:50]
            try:
                existing = Shop.objects.get(slug=requested_slug)
                existing_serialized = ShopSerializer(existing, context={'request': request})
                return Response(existing_serialized.data, status=status.HTTP_200_OK)
            except Shop.DoesNotExist:
                return Response({"detail": "Error de integridad al crear la tienda."}, status=status.HTTP_400_BAD_REQUEST)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ShopDetailView(generics.RetrieveAPIView):
    """
    Obtener shop por slug. Permite acceder a shop inactiva si el requester es staff o owner.
    """
    serializer_class = ShopSerializer
    lookup_field = "slug"

    def get_queryset(self):
        user = self.request.user
        qs = Shop.objects.all()
        # Si no es staff devolvemos sólo activas (pero allow retrieve_by_slug below handles owner case)
        if not (user and user.is_authenticated and user.is_staff):
            qs = qs.filter(active=True)
        return qs


class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.all().order_by('-created_at')
    serializer_class = ShopSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsMerchantOrAdmin, IsShopOwnerOrReadOnly]

    def get_queryset(self):
        """
        Por defecto devolvemos sólo shops activas para consumidores.
        Staff ve todo.
        Optimización: select_related('owner') y prefetch_related('products') para evitar N+1.
        """
        user = self.request.user
        qs = Shop.objects.select_related('owner').prefetch_related('products').order_by('-created_at')
        if not (user and user.is_authenticated and user.is_staff):
            qs = qs.filter(active=True)
        q = self.request.query_params.get('search')
        if q:
            qs = qs.filter(name__icontains=q)
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Override create para manejo idempotente de slug duplicado:
        si el slug ya existe, devolvemos el objeto existente (200).
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except IntegrityError:
            requested_slug = request.data.get('slug')
            if not requested_slug:
                requested_slug = slugify(request.data.get('name', ''))[:50]
            try:
                existing = Shop.objects.get(slug=requested_slug)
                existing_serialized = ShopSerializer(existing, context={'request': request})
                return Response(existing_serialized.data, status=status.HTTP_200_OK)
            except Shop.DoesNotExist:
                return Response({"detail": "Error de integridad al crear la tienda."}, status=status.HTTP_400_BAD_REQUEST)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get', 'put'], url_path='my', permission_classes=[IsAuthenticated])
    def my_shop(self, request):
        """
        GET /api/shops/my/ -> retorna la primera tienda del owner autenticado (uso actual del frontend)
        PUT /api/shops/my/ -> actualiza esa tienda con los datos enviados
        Nota: si el usuario tiene múltiples tiendas, se toma la más reciente por created_at.
        """
        user = request.user
        qs = Shop.objects.filter(owner=user).order_by('-created_at')
        instance = qs.first()

        if request.method.lower() == 'get':
            if not instance:
                return Response({"detail": "No tienes tiendas creadas."}, status=status.HTTP_404_NOT_FOUND)
            data = ShopSerializer(instance, context={'request': request}).data
            return Response(data, status=status.HTTP_200_OK)

        # PUT
        if not instance:
            return Response({"detail": "No tienes tiendas para actualizar."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ShopSerializer(instance, data=request.data, partial=False, context={'request': request})
        serializer.is_valid(raise_exception=True)
        # Validar ownership explícitamente
        if instance.owner_id != user.id and not user.is_staff:
            raise exceptions.PermissionDenied("No tienes permisos para actualizar esta tienda.")
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='slug/(?P<slug>[-a-zA-Z0-9_]+)')
    def retrieve_by_slug(self, request, slug=None):
        """
        GET /api/shops/slug/<slug>/
        Devuelve una tienda individual. Si la tienda está inactiva, sólo la retorna si
        el requester es owner o staff.
        """
        # Buscar la shop (sin aplicar filtro activo)
        try:
            shop = Shop.objects.get(slug=slug)
        except Shop.DoesNotExist:
            return Response({"detail": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)

        # Si la shop está inactiva, permitir ver solo si requester es staff o owner
        if not shop.active:
            user = request.user
            if not (user and user.is_authenticated and (user.is_staff or shop.owner_id == getattr(user, 'id', None))):
                return Response({"detail": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ShopSerializer(shop, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProductViewSet(viewsets.ModelViewSet):
    Product = ProductModel
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'list_by_shop']:
            return [AllowAny()]
        return [IsMerchantOrAdmin()]

    def get_queryset(self):
        # Para actions administrativas (update_stock, toggle_active), no filtrar por active
        if self.action in ['update_stock', 'toggle_active', 'update', 'partial_update', 'destroy']:
            qs = self.Product.objects.all()
        else:
            qs = self.Product.objects.filter(active=True)
        
        qs = qs.order_by('-created_at')

        field_names = {f.name for f in self.Product._meta.get_fields()}
        if 'shop' in field_names:
            try:
                qs = qs.select_related('shop')
            except Exception:
                pass

        # Filter by shop
        shop_id = self.request.query_params.get('shop')
        if shop_id:
            qs = qs.filter(shop_id=shop_id)

        # Search filter (name or description)
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

        # Category filter
        category = self.request.query_params.get('category')
        if category and 'category' in field_names:
            qs = qs.filter(category_id=category)

        # Price range filters
        price_min = self.request.query_params.get('price_min')
        if price_min:
            try:
                qs = qs.filter(price__gte=float(price_min))
            except ValueError:
                pass

        price_max = self.request.query_params.get('price_max')
        if price_max:
            try:
                qs = qs.filter(price__lte=float(price_max))
            except ValueError:
                pass

        # In stock filter
        in_stock = self.request.query_params.get('in_stock')
        if in_stock and in_stock.lower() in ['true', '1', 'yes']:
            qs = qs.filter(stock__gt=0)

        return qs

    def validate_shop_ownership(self, serializer):
        user = self.request.user
        shop = serializer.validated_data.get('shop') if hasattr(serializer, 'validated_data') else None

        if not shop:
            return

        if user.is_staff:
            return

        if getattr(shop, 'owner', None) != user:
            raise exceptions.PermissionDenied(
                "No tienes permisos para administrar productos en esta tienda."
            )

    def perform_create(self, serializer):
        self.validate_shop_ownership(serializer)
        serializer.save()

    def perform_update(self, serializer):
        if not serializer.validated_data.get('shop'):
            instance_shop = getattr(getattr(serializer, 'instance', None), 'shop', None)
            if instance_shop and not self.request.user.is_staff and instance_shop.owner != self.request.user:
                raise exceptions.PermissionDenied("No tienes permisos para editar este producto.")
        else:
            self.validate_shop_ownership(serializer)

        serializer.save()

    @action(detail=False, methods=['get'], url_path='by-shop/(?P<slug>[-a-zA-Z0-9_]+)')
    def list_by_shop(self, request, slug=None):
        shop = get_object_or_404(Shop, slug=slug)
        # Si la shop está inactiva, sólo permitir listar productos si requester es staff o owner
        if not shop.active:
            user = request.user
            if not (user and user.is_authenticated and (user.is_staff or shop.owner_id == getattr(user, 'id', None))):
                return Response({"detail": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)

        qs = self.get_queryset().filter(shop=shop)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='my', permission_classes=[IsAuthenticated])
    def my_products(self, request):
        """
        GET /api/products/my/ -> lista productos cuyos shops pertenecen al usuario autenticado.
        """
        user = request.user
        qs = self.get_queryset().filter(shop__owner=user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='update-stock', permission_classes=[IsAuthenticated])
    def update_stock(self, request, pk=None):
        """
        PATCH /api/products/<id>/update-stock/ -> actualiza solo el stock de un producto.
        Body: {"stock": <new_value>}
        """
        product = self.get_object()
        user = request.user
        
        # Verificar ownership
        if not user.is_staff and product.shop.owner != user:
            raise exceptions.PermissionDenied("No tienes permisos para actualizar este producto.")
        
        new_stock = request.data.get('stock')
        if new_stock is None:
            return Response({'error': 'Se requiere el campo stock.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_stock = int(new_stock)
            if new_stock < 0:
                return Response({'error': 'El stock no puede ser negativo.'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'El stock debe ser un número entero.'}, status=status.HTTP_400_BAD_REQUEST)
        
        product.stock = new_stock
        product.save(update_fields=['stock'])
        
        serializer = self.get_serializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='toggle-active', permission_classes=[IsAuthenticated])
    def toggle_active(self, request, pk=None):
        """
        PATCH /api/products/<id>/toggle_active/ -> activa/desactiva un producto.
        Body: {"active": true/false} (opcional, si no se envía hace toggle)
        """
        product = self.get_object()
        user = request.user
        
        # Verificar ownership
        if not user.is_staff and product.shop.owner != user:
            raise exceptions.PermissionDenied("No tienes permisos para actualizar este producto.")
        
        active = request.data.get('active')
        if active is None:
            # Toggle si no se especifica
            product.active = not product.active
        else:
            # Convertir a boolean de manera robusta
            if isinstance(active, bool):
                product.active = active
            elif isinstance(active, str):
                product.active = active.lower() in ('true', '1', 'yes')
            else:
                product.active = bool(active)
        
        product.save(update_fields=['active'])
        
        serializer = self.get_serializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='low-stock', permission_classes=[IsAuthenticated])
    def low_stock(self, request):
        """
        GET /api/products/low_stock/?threshold=10 -> productos con stock bajo del merchant.
        Threshold por defecto: 10. Solo para merchants.
        """
        user = request.user
        
        # Solo merchants pueden ver su inventario bajo
        if not user.is_merchant:
            raise exceptions.PermissionDenied("Solo los comerciantes pueden acceder a esta función.")
        
        threshold = request.query_params.get('threshold', 10)
        
        try:
            threshold = int(threshold)
        except (ValueError, TypeError):
            threshold = 10
        
        qs = ProductModel.objects.filter(
            shop__owner=user,
            active=True,
            stock__lte=threshold
        ).select_related('shop').order_by('stock', '-created_at')
        
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
