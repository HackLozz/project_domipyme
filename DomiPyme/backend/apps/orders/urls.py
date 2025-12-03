from django.urls import path
from .views import CheckoutView, MyOrdersView
from rest_framework import routers
from .views import OrderDetailView, MerchantMyOrdersView, OrderStatusUpdateView, MerchantOrdersStatsView

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="orders-checkout"),
    path("orders/my/", MyOrdersView.as_view(), name="orders-my"),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='orders-detail'),
    path('orders/merchant/my/', MerchantMyOrdersView.as_view(), name='orders-merchant-my'),
    path('orders/merchant/stats/', MerchantOrdersStatsView.as_view(), name='orders-merchant-stats'),
    path('orders/<int:pk>/status/', OrderStatusUpdateView.as_view(), name='orders-status-update'),
]
