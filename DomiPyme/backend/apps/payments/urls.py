# backend/apps/payments/urls.py
from django.urls import path
from .views import PaymentListView, TransactionListCreateView

app_name = "payments"

urlpatterns = [
    path('', PaymentListView.as_view(), name='payments-list'),
    path('transactions/', TransactionListCreateView.as_view(), name='transactions-list-create'),
]
