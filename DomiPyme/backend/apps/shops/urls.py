# backend/apps/shops/urls.py
from rest_framework import routers
from django.urls import path, include
from .views import ShopViewSet, ProductViewSet

router = routers.DefaultRouter()
router.register(r'shops', ShopViewSet, basename='shop')
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    # Rutas generadas por el router (shop-list -> 'shop-list', etc.)
    path('', include(router.urls)),

    # Rutas explícitas con nombres para compatibilidad con tests / clientes antiguos.
    # shops-list-create -> GET list, POST create
    path('shops/', ShopViewSet.as_view({'get': 'list', 'post': 'create'}), name='shops-list-create'),
    # shops-detail -> GET/PUT/PATCH/DELETE on specific shop
    path('shops/<int:pk>/', ShopViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='shops-detail'),

    # products-list-create -> list and create
    path('products/', ProductViewSet.as_view({'get': 'list', 'post': 'create'}), name='products-list-create'),
    # products-detail -> retrieve/update/destroy
    path('products/<int:pk>/', ProductViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='products-detail'),
]
