# backend/apps/shops/urls.py
from rest_framework import routers
from django.urls import path, include
from .views import ShopViewSet, ProductViewSet, CategoryViewSet, ProductImageViewSet, ReviewViewSet

router = routers.DefaultRouter()
router.register(r'shops', ShopViewSet, basename='shop')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'product-images', ProductImageViewSet, basename='product-image')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    # Rutas generadas por el router (shop-list -> 'shop-list', etc.)
    path('', include(router.urls)),
]
