from django.db import models
from django.conf import settings

class Transaction(models.Model):
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='transaction')
    provider = models.CharField(max_length=50)  # e.g., payu, mercadopago
    provider_tx_id = models.CharField(max_length=200, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=50)  # pending, approved, rejected
    raw_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
