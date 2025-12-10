from django.db import models
from django.conf import settings

class Transaction(models.Model):
    """
    Modelo de transacción de pago.
    Relaciona una orden con el proveedor de pagos, estado y respuesta cruda.
    """
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='transaction')
    provider = models.CharField(max_length=50)  # e.g., payu, mercadopago
    provider_tx_id = models.CharField(max_length=200, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=50)  # pending, approved, rejected
    raw_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """
        Representación legible de la transacción para administración y logs.
        """
        return f"{self.provider} - {self.status} (${self.amount})"
