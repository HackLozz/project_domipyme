# backend/apps/products/urls.py
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet
from django.urls import path, include

router = DefaultRouter()
router.register('products', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
]
