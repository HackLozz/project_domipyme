import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.shops.models import Shop, Product

User = get_user_model()

@pytest.mark.django_db
def test_checkout_creates_order():
    client = APIClient()
    user = User.objects.create_user(email="u@test.com", password="pass1234")
    shop = Shop.objects.create(owner=user, name="TiendaX", slug="tiendax")
    product = Product.objects.create(shop=shop, name="Cafe", price=10000, stock=5)
    client.force_authenticate(user=user)
    payload = {"items":[ {"product": product.id, "price":"10000.00", "qty":1 } ]}
    resp = client.post(reverse("orders-checkout"), payload, format="json")
    assert resp.status_code == 201
    assert "payment_url" in resp.data
