from django.test import TestCase
from .models import Product

"""
Tests para la app de productos.
Agrega aquí tus casos de prueba unitarios y de integración.
"""

class ProductModelTest(TestCase):
    def test_product_slug_generation(self):
        """Verifica que el slug se genera correctamente y es único."""
        p1 = Product.objects.create(name="Test Product", price=10, stock=5)
        p2 = Product.objects.create(name="Test Product", price=20, stock=10)
        self.assertNotEqual(p1.slug, p2.slug)
        self.assertTrue(p1.slug.startswith("test-product"))
        self.assertTrue(p2.slug.startswith("test-product"))

    def test_product_str(self):
        """Verifica la representación string del producto."""
        p = Product.objects.create(name="Test Product", price=10, stock=5)
        self.assertEqual(str(p), "Test Product")
