import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.products.models import ProductItem
from apps.shops.models import Shop

@pytest.mark.django_db
def test_product_create_requires_merchant_or_admin():
    User = get_user_model()
    user = User.objects.create_user(email='user@domipyme.com', password='P@ssw0rd!2025')
    shop = Shop.objects.create(owner=user, name='Tienda1')
    client = APIClient()
    client.force_authenticate(user)
    url = reverse('product-list')
    data = {'shop': shop.id, 'name': 'Prod Test', 'price': 10, 'stock': 5}
    resp = client.post(url, data)
    assert resp.status_code == 403

@pytest.mark.django_db
def test_product_create_as_merchant():
    User = get_user_model()
    user = User.objects.create_user(email='merchant@domipyme.com', password='P@ssw0rd!2025', is_merchant=True)
    shop = Shop.objects.create(owner=user, name='Tienda Merchant')
    client = APIClient()
    client.force_authenticate(user)
    url = reverse('product-list')
    data = {'shop': shop.id, 'name': 'Prod Merchant', 'price': 10, 'stock': 5}
    resp = client.post(url, data)
    assert resp.status_code == 201
    assert resp.data['name'] == 'Prod Merchant'

@pytest.mark.django_db
def test_product_update_only_merchant_or_admin():
    User = get_user_model()
    merchant = User.objects.create_user(email='merchant2@domipyme.com', password='P@ssw0rd!2025', is_merchant=True)
    shop = Shop.objects.create(owner=merchant, name='Tienda Propio')
    product = ProductItem.objects.create(shop=shop, name='Prod Propio', price=10, stock=5, active=True)
    other = User.objects.create_user(email='other@domipyme.com', password='P@ssw0rd!2025')
    client = APIClient()
    client.force_authenticate(other)
    url = reverse('productitem-detail', args=[product.pk])
    data = {'shop': shop.id, 'name': 'Hackeado', 'price': 10, 'stock': 5}
    resp = client.put(url, data)
    assert resp.status_code == 403

@pytest.mark.django_db
def test_product_update_by_admin():
    User = get_user_model()
    admin = User.objects.create_user(email='admin@domipyme.com', password='P@ssw0rd!2025', is_staff=True)
    shop = Shop.objects.create(owner=admin, name='Tienda Admin')
    product = ProductItem.objects.create(shop=shop, name='Prod Admin', price=10, stock=5, active=True)
    client = APIClient()
    client.force_authenticate(admin)
    url = reverse('productitem-detail', args=[product.pk])
    data = {'shop': shop.id, 'name': 'Actualizado por admin', 'price': 10, 'stock': 5}
    resp = client.put(url, data)
    assert resp.status_code == 200
    assert resp.data['name'] == 'Actualizado por admin'

@pytest.mark.django_db
def test_product_create_invalid_price():
    User = get_user_model()
    user = User.objects.create_user(email='merchant3@domipyme.com', password='P@ssw0rd!2025', is_merchant=True)
    shop = Shop.objects.create(owner=user, name='Tienda Inv')
    client = APIClient()
    client.force_authenticate(user)
    url = reverse('product-list')
    data = {'shop': shop.id, 'name': 'Prod Inv', 'price': -5, 'stock': 5}
    resp = client.post(url, data)
    assert resp.status_code == 400
    assert 'precio' in str(resp.data).lower() or 'mayor o igual a 0' in str(resp.data).lower()
