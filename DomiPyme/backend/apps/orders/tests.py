from django.test import TestCase
from .models import Cart
from django.contrib.auth import get_user_model

class CartModelTest(TestCase):
    def test_cart_creation_for_user(self):
        """Verifica que el carrito se asocia correctamente a un usuario."""
        User = get_user_model()
        user = User.objects.create_user(email="test@domipyme.com", password="123456")
        cart = Cart.objects.create(user=user)
        self.assertEqual(cart.user.email, "test@domipyme.com")

    def test_cart_total_items(self):
        """Verifica el cálculo de total_items en el carrito."""
        cart = Cart.objects.create()
        self.assertEqual(cart.total_items, 0)

"""
Tests para la app de órdenes.
Agrega aquí tus casos de prueba unitarios y de integración.
"""
