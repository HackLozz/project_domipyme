from django.urls import path, include
from .views import (
    CheckoutView,
    MyOrdersView,
    OrderDetailView,
    MerchantMyOrdersView,
    OrderStatusUpdateView,
    MerchantOrdersStatsView,
    CartViewSet,
    CreatePaymentIntentView,
    stripe_webhook,
    PaymentViewSet,
)
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'payment-history', PaymentViewSet, basename='payment')

urlpatterns = [
    # Payment endpoints (antes del router para evitar conflictos)
    path('payments/create-intent/', CreatePaymentIntentView.as_view(), name='payments-create-intent'),
    path('payments/webhook/stripe/', stripe_webhook, name='payments-webhook-stripe'),
    
    # Router endpoints
    path("", include(router.urls)),
    
    # Order endpoints
    path("checkout/", CheckoutView.as_view(), name="orders-checkout"),
    path("orders/my/", MyOrdersView.as_view(), name="orders-my"),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='orders-detail'),
    path('orders/merchant/my/', MerchantMyOrdersView.as_view(), name='orders-merchant-my'),
    path('orders/merchant/stats/', MerchantOrdersStatsView.as_view(), name='orders-merchant-stats'),
    path('orders/<int:pk>/status/', OrderStatusUpdateView.as_view(), name='orders-status-update'),
]
