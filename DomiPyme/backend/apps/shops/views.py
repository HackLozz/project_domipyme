from rest_framework import viewsets, generics, permissions, status, exceptions
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.apps import apps
from django.shortcuts import get_object_or_404
from django.db import IntegrityError, models
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

    @action(detail=False, methods=['get'], url_path='analytics/sales', permission_classes=[IsAuthenticated])
    def analytics_sales(self, request):
        """
        GET /api/products/analytics/sales/?period=7d
        Analíticas de ventas por período (7d, 30d, 90d, 1y, all).
        Solo para merchants.
        """
        user = request.user
        if not user.is_merchant:
            raise exceptions.PermissionDenied("Solo los comerciantes pueden acceder a analíticas.")
        
        from apps.orders.models import Order, OrderItem
        from django.db.models import Sum, Count, Avg, F
        from django.utils import timezone
        from datetime import timedelta
        
        period = request.query_params.get('period', '30d')
        now = timezone.now()
        
        # Calcular fecha de inicio según período
        period_map = {
            '7d': timedelta(days=7),
            '30d': timedelta(days=30),
            '90d': timedelta(days=90),
            '1y': timedelta(days=365),
        }
        
        if period in period_map:
            start_date = now - period_map[period]
            orders = Order.objects.filter(created_at__gte=start_date)
        else:  # 'all'
            orders = Order.objects.all()
        
        # Filtrar por productos del merchant
        merchant_products = ProductModel.objects.filter(shop__owner=user)
        order_items = OrderItem.objects.filter(
            product__in=merchant_products,
            order__in=orders
        ).select_related('order', 'product', 'product__shop')
        
        # Calcular métricas
        total_sales = order_items.aggregate(
            total=Sum(F('quantity') * F('price'))
        )['total'] or 0
        
        total_orders = order_items.values('order').distinct().count()
        total_items_sold = order_items.aggregate(total=Sum('quantity'))['total'] or 0
        avg_order_value = total_sales / total_orders if total_orders > 0 else 0
        
        # Productos más vendidos
        top_products = order_items.values(
            'product__id',
            'product__name',
            'product__shop__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum(F('quantity') * F('price'))
        ).order_by('-total_quantity')[:10]
        
        # Ventas por día (últimos 30 días para gráfico)
        if period in ['7d', '30d']:
            days = 7 if period == '7d' else 30
            sales_by_day = []
            for i in range(days):
                day = now - timedelta(days=i)
                day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)
                
                day_items = order_items.filter(
                    order__created_at__gte=day_start,
                    order__created_at__lt=day_end
                )
                day_total = day_items.aggregate(
                    total=Sum(F('quantity') * F('price'))
                )['total'] or 0
                
                sales_by_day.append({
                    'date': day_start.strftime('%Y-%m-%d'),
                    'total': float(day_total)
                })
            
            sales_by_day.reverse()  # Orden cronológico
        else:
            sales_by_day = []
        
        return Response({
            'period': period,
            'total_sales': float(total_sales),
            'total_orders': total_orders,
            'total_items_sold': total_items_sold,
            'avg_order_value': float(avg_order_value),
            'top_products': list(top_products),
            'sales_by_day': sales_by_day,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='analytics/inventory', permission_classes=[IsAuthenticated])
    def analytics_inventory(self, request):
        """
        GET /api/products/analytics/inventory/
        Analíticas de inventario: stock total, productos activos, categorías, etc.
        Solo para merchants.
        """
        user = request.user
        if not user.is_merchant:
            raise exceptions.PermissionDenied("Solo los comerciantes pueden acceder a analíticas.")
        
        from django.db.models import Sum, Count, Avg, F

        # Productos del merchant
        products = ProductModel.objects.filter(shop__owner=user)

        # Métricas generales
        total_products = products.count()
        active_products = products.filter(active=True).count()
        inactive_products = products.filter(active=False).count()
        total_stock_value = products.aggregate(
            total=Sum(F('stock') * F('price'))
        )['total'] or 0
        avg_price = products.aggregate(avg=Avg('price'))['avg'] or 0
        
        # Stock por rango
        out_of_stock = products.filter(stock=0).count()
        low_stock = products.filter(stock__gt=0, stock__lte=10).count()
        medium_stock = products.filter(stock__gt=10, stock__lte=50).count()
        high_stock = products.filter(stock__gt=50).count()
        
        # Productos por categoría
        products_by_category = products.values('category__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return Response({
            'total_products': total_products,
            'active_products': active_products,
            'inactive_products': inactive_products,
            'total_stock_value': float(total_stock_value),
            'avg_price': float(avg_price),
            'stock_distribution': {
                'out_of_stock': out_of_stock,
                'low_stock': low_stock,
                'medium_stock': medium_stock,
                'high_stock': high_stock,
            },
            'products_by_category': list(products_by_category),
        }, status=status.HTTP_200_OK)


# ----- Category ViewSet -----
class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar categorías de productos por tienda.
    - List/Create: GET/POST /api/categories/
    - Retrieve/Update/Delete: GET/PUT/PATCH/DELETE /api/categories/{id}/
    - Filtros: ?shop=<shop_id>, ?active=true
    - Custom actions: by-shop/<shop_id>/, reorder/
    """
    from .models import Category
    from .serializers import CategorySerializer
    
    queryset = Category.objects.select_related('shop').all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Filtrar categorías por shop y active status"""
        queryset = self.queryset
        
        # Filtrar por shop
        shop_id = self.request.query_params.get('shop')
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        
        # Filtrar por active
        active = self.request.query_params.get('active')
        if active is not None:
            queryset = queryset.filter(active=active.lower() in ['true', '1', 'yes'])
        
        return queryset

    def perform_create(self, serializer):
        """Solo el owner de la tienda puede crear categorías"""
        shop_id = serializer.validated_data.get('shop').id
        shop = get_object_or_404(Shop, id=shop_id)
        
        user = self.request.user
        if not user.is_authenticated:
            raise exceptions.PermissionDenied("Debes estar autenticado.")
        
        if shop.owner != user and not user.is_staff:
            raise exceptions.PermissionDenied("Solo el propietario de la tienda puede crear categorías.")
        
        serializer.save()

    def perform_update(self, serializer):
        """Solo el owner de la tienda puede actualizar categorías"""
        instance = self.get_object()
        user = self.request.user
        
        if instance.shop.owner != user and not user.is_staff:
            raise exceptions.PermissionDenied("Solo el propietario de la tienda puede editar categorías.")
        
        serializer.save()

    def perform_destroy(self, instance):
        """Solo el owner de la tienda puede eliminar categorías"""
        user = self.request.user
        
        if instance.shop.owner != user and not user.is_staff:
            raise exceptions.PermissionDenied("Solo el propietario de la tienda puede eliminar categorías.")
        
        # Verificar si hay productos asignados
        if instance.products.exists():
            raise exceptions.ValidationError(
                "No se puede eliminar una categoría con productos asignados. "
                "Primero reasigna o elimina los productos."
            )
        
        instance.delete()

    @action(detail=False, methods=['get'], url_path='by-shop/(?P<shop_id>[^/.]+)')
    def by_shop(self, request, shop_id=None):
        """
        GET /api/categories/by-shop/{shop_id}/
        Obtener todas las categorías de una tienda específica
        """
        categories = self.queryset.filter(shop_id=shop_id, active=True)
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def reorder(self, request):
        """
        POST /api/categories/reorder/
        Body: { "categories": [{"id": 1, "order": 0}, {"id": 2, "order": 1}, ...] }
        Reordenar categorías de una tienda
        """
        from .models import Category
        
        user = request.user
        categories_data = request.data.get('categories', [])
        
        if not categories_data:
            return Response(
                {'error': 'Debes proporcionar un array de categorías con id y order.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que todas las categorías pertenecen a tiendas del usuario
        category_ids = [c['id'] for c in categories_data]
        categories = Category.objects.filter(id__in=category_ids).select_related('shop')
        
        for category in categories:
            if category.shop.owner != user and not user.is_staff:
                raise exceptions.PermissionDenied(
                    f"No tienes permiso para reordenar la categoría {category.name}."
                )
        
        # Actualizar el orden
        for cat_data in categories_data:
            Category.objects.filter(id=cat_data['id']).update(order=cat_data['order'])
        
        return Response({'message': 'Categorías reordenadas exitosamente.'}, status=status.HTTP_200_OK)


# ----- ProductImage ViewSet -----
class ProductImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar imágenes de productos.
    - List/Create: GET/POST /api/product-images/
    - Retrieve/Update/Delete: GET/PUT/PATCH/DELETE /api/product-images/{id}/
    - Custom actions: set-primary/{id}/, reorder/
    """
    from .models import ProductImage
    from .serializers import ProductImageSerializer
    
    queryset = ProductImage.objects.select_related('product', 'product__shop').all()
    serializer_class = ProductImageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Filtrar imágenes por product_id si se proporciona"""
        queryset = self.queryset
        
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        return queryset

    def perform_create(self, serializer):
        """Solo el owner del producto puede agregar imágenes"""
        product_id = serializer.validated_data.get('product').id
        product = get_object_or_404(ProductModel, id=product_id)
        
        user = self.request.user
        if not user.is_authenticated:
            raise exceptions.PermissionDenied("Debes estar autenticado.")
        
        if product.shop.owner != user and not user.is_staff:
            raise exceptions.PermissionDenied("Solo el propietario del producto puede agregar imágenes.")
        
        serializer.save()

    def perform_update(self, serializer):
        """Solo el owner del producto puede actualizar imágenes"""
        instance = self.get_object()
        user = self.request.user
        
        if instance.product.shop.owner != user and not user.is_staff:
            raise exceptions.PermissionDenied("Solo el propietario del producto puede editar imágenes.")
        
        serializer.save()

    def perform_destroy(self, instance):
        """Solo el owner del producto puede eliminar imágenes"""
        user = self.request.user
        
        if instance.product.shop.owner != user and not user.is_staff:
            raise exceptions.PermissionDenied("Solo el propietario del producto puede eliminar imágenes.")
        
        # Eliminar el archivo físico
        if instance.image:
            instance.image.delete(save=False)
        
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], url_path='set-primary')
    def set_primary(self, request, pk=None):
        """
        POST /api/product-images/{id}/set-primary/
        Marcar esta imagen como principal del producto
        """
        image = self.get_object()
        user = request.user
        
        # Verificar ownership
        if image.product.shop.owner != user and not user.is_staff:
            raise exceptions.PermissionDenied("No tienes permiso para modificar esta imagen.")
        
        # Marcar como primary (el save() del modelo se encarga de desmarcar las demás)
        image.is_primary = True
        image.save()
        
        serializer = self.get_serializer(image)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def reorder(self, request):
        """
        POST /api/product-images/reorder/
        Body: { "images": [{"id": 1, "order": 0}, {"id": 2, "order": 1}, ...] }
        Reordenar imágenes de un producto
        """
        from .models import ProductImage
        
        user = request.user
        images_data = request.data.get('images', [])
        
        if not images_data:
            return Response(
                {'error': 'Debes proporcionar un array de imágenes con id y order.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que todas las imágenes pertenecen a productos del usuario
        image_ids = [img['id'] for img in images_data]
        images = ProductImage.objects.filter(id__in=image_ids).select_related('product__shop')
        
        for image in images:
            if image.product.shop.owner != user and not user.is_staff:
                raise exceptions.PermissionDenied(
                    f"No tienes permiso para reordenar imágenes del producto {image.product.name}."
                )
        
        # Actualizar el orden
        for img_data in images_data:
            ProductImage.objects.filter(id=img_data['id']).update(order=img_data['order'])
        
        return Response({'message': 'Imágenes reordenadas exitosamente.'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='bulk-upload')
    def bulk_upload(self, request):
        """
        POST /api/product-images/bulk-upload/
        Body: { "product": <product_id>, "images": [<file1>, <file2>, ...] }
        Subir múltiples imágenes a la vez
        """
        from .models import ProductImage
        
        user = request.user
        product_id = request.data.get('product')
        images_files = request.FILES.getlist('images')
        
        if not product_id:
            return Response({'error': 'Debes proporcionar el ID del producto.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not images_files:
            return Response({'error': 'Debes proporcionar al menos una imagen.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar ownership
        product = get_object_or_404(ProductModel, id=product_id)
        if product.shop.owner != user and not user.is_staff:
            raise exceptions.PermissionDenied("No tienes permiso para agregar imágenes a este producto.")
        
        # Obtener el máximo order actual
        max_order = ProductImage.objects.filter(product=product).aggregate(max_order=models.Max('order'))['max_order'] or -1
        
        # Crear las imágenes
        created_images = []
        for idx, img_file in enumerate(images_files):
            product_image = ProductImage.objects.create(
                product=product,
                image=img_file,
                order=max_order + idx + 1,
                alt_text=f"{product.name} - Image {max_order + idx + 2}"
            )
            created_images.append(product_image)
        
        serializer = self.get_serializer(created_images, many=True)
        return Response({
            'message': f'{len(created_images)} imágenes subidas exitosamente.',
            'images': serializer.data
        }, status=status.HTTP_201_CREATED)


# ----- Review ViewSet -----
class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar reseñas de productos.
    - List/Create: GET/POST /api/reviews/
    - Retrieve/Update/Delete: GET/PUT/PATCH/DELETE /api/reviews/{id}/
    - Filtros: ?product=<id>, ?user=<id>, ?rating=<1-5>
    - Custom actions: my-reviews/, mark-helpful/{id}/, product-reviews/<product_id>/
    """
    from .models import Review, ReviewHelpful
    from .serializers import ReviewSerializer
    
    queryset = Review.objects.select_related('product', 'user').all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Filtrar reseñas por product, user, rating"""
        queryset = self.queryset
        
        # Filtrar por producto
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filtrar por usuario
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filtrar por rating
        rating = self.request.query_params.get('rating')
        if rating:
            try:
                queryset = queryset.filter(rating=int(rating))
            except ValueError:
                pass
        
        # Filtrar por verified_purchase
        verified = self.request.query_params.get('verified')
        if verified is not None:
            queryset = queryset.filter(verified_purchase=verified.lower() in ['true', '1', 'yes'])
        
        return queryset

    def perform_create(self, serializer):
        """Solo usuarios autenticados pueden crear reseñas"""
        user = self.request.user
        if not user.is_authenticated:
            raise exceptions.PermissionDenied("Debes estar autenticado para dejar una reseña.")
        
        product_id = serializer.validated_data.get('product').id
        product = get_object_or_404(ProductModel, id=product_id)
        
        # Verificar si el usuario ya dejó una reseña para este producto
        from .models import Review
        if Review.objects.filter(product=product, user=user).exists():
            raise exceptions.ValidationError("Ya dejaste una reseña para este producto. Puedes editarla en lugar de crear una nueva.")
        
        # TODO: Verificar si el usuario compró el producto (verified_purchase)
        # Por ahora, siempre es False
        verified_purchase = False
        
        serializer.save(user=user, verified_purchase=verified_purchase)

    def perform_update(self, serializer):
        """Solo el autor de la reseña puede actualizarla"""
        instance = self.get_object()
        user = self.request.user
        
        if instance.user != user and not user.is_staff:
            raise exceptions.PermissionDenied("Solo puedes editar tus propias reseñas.")
        
        serializer.save()

    def perform_destroy(self, instance):
        """Solo el autor o staff pueden eliminar una reseña"""
        user = self.request.user
        
        if instance.user != user and not user.is_staff:
            raise exceptions.PermissionDenied("Solo puedes eliminar tus propias reseñas.")
        
        instance.delete()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_reviews(self, request):
        """
        GET /api/reviews/my-reviews/
        Obtener todas las reseñas del usuario autenticado
        """
        user = request.user
        reviews = self.queryset.filter(user=user)
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], url_path='mark-helpful')
    def mark_helpful(self, request, pk=None):
        """
        POST /api/reviews/{id}/mark-helpful/
        Marcar una reseña como útil (toggle)
        """
        from .models import Review, ReviewHelpful
        
        review = self.get_object()
        user = request.user
        
        # No permitir marcar la propia reseña como útil
        if review.user == user:
            return Response(
                {'error': 'No puedes marcar tu propia reseña como útil.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Toggle: si ya existe, eliminar; si no, crear
        helpful, created = ReviewHelpful.objects.get_or_create(review=review, user=user)
        
        if not created:
            # Ya existía, eliminar (toggle off)
            helpful.delete()
            review.helpful_count = max(0, review.helpful_count - 1)
            review.save()
            message = 'Marcaste esta reseña como no útil.'
            is_helpful = False
        else:
            # Se creó (toggle on)
            review.helpful_count += 1
            review.save()
            message = 'Marcaste esta reseña como útil.'
            is_helpful = True
        
        serializer = self.get_serializer(review)
        return Response({
            'message': message,
            'is_helpful': is_helpful,
            'helpful_count': review.helpful_count,
            'review': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='product-reviews/(?P<product_id>[^/.]+)')
    def product_reviews(self, request, product_id=None):
        """
        GET /api/reviews/product-reviews/<product_id>/
        Obtener todas las reseñas de un producto específico con paginación
        """
        reviews = self.queryset.filter(product_id=product_id)
        
        # Ordenar por parámetro
        sort_by = request.query_params.get('sort', 'recent')
        if sort_by == 'helpful':
            reviews = reviews.order_by('-helpful_count', '-created_at')
        elif sort_by == 'rating_high':
            reviews = reviews.order_by('-rating', '-created_at')
        elif sort_by == 'rating_low':
            reviews = reviews.order_by('rating', '-created_at')
        else:  # 'recent' por defecto
            reviews = reviews.order_by('-created_at')
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
