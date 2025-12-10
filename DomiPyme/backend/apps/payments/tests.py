from django.test import TestCase
from .models import Transaction
from django.contrib.auth import get_user_model
from apps.orders.models import Order

class TransactionModelTest(TestCase):
    def test_transaction_str(self):
        """Verifica la representación string de la transacción."""
        User = get_user_model()
        user = User.objects.create_user(email="test@domipyme.com", password="123456")
        order = Order.objects.create(customer=user)
        tx = Transaction.objects.create(order=order, provider="payu", amount=100, status="pending")
        self.assertIn("payu", str(tx))
        self.assertIn("pending", str(tx))

"""
Tests para la app de pagos.
Agrega aquí tus casos de prueba unitarios y de integración.
"""
