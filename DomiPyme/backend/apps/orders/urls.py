from django.urls import path
from .views import CheckoutView, MyOrdersView

urlpatterns = [
    path("checkout/", CheckoutView.as_view(), name="orders-checkout"),
    path("orders/my/", MyOrdersView.as_view(), name="orders-my"),
]
