import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.shops.models import Shop

@pytest.mark.django_db
def test_shop_create_requires_merchant_or_admin():
    User = get_user_model()
    user = User.objects.create_user(email='user@domipyme.com', password='P@ssw0rd!2025')
    client = APIClient()
    client.force_authenticate(user)
    url = reverse('shop-list')
    data = {'name': 'Tienda Test'}
    resp = client.post(url, data)
    assert resp.status_code == 403

@pytest.mark.django_db
def test_shop_create_as_merchant():
    User = get_user_model()
    user = User.objects.create_user(email='merchant@domipyme.com', password='P@ssw0rd!2025', is_merchant=True)
    client = APIClient()
    client.force_authenticate(user)
    url = reverse('shop-list')
    data = {'name': 'Tienda Merchant'}
    resp = client.post(url, data)
    assert resp.status_code == 201
    assert resp.data['name'] == 'Tienda Merchant'

@pytest.mark.django_db
def test_shop_update_only_owner_or_admin():
    User = get_user_model()
    owner = User.objects.create_user(email='owner@domipyme.com', password='P@ssw0rd!2025', is_merchant=True)
    other = User.objects.create_user(email='other@domipyme.com', password='P@ssw0rd!2025')
    shop = Shop.objects.create(owner=owner, name='Tienda Propia')
    client = APIClient()
    client.force_authenticate(other)
    url = reverse('shop-detail', args=[shop.pk])
    data = {'name': 'Hackeada'}
    resp = client.put(url, data)
    assert resp.status_code == 403

@pytest.mark.django_db
def test_shop_update_by_admin():
    User = get_user_model()
    owner = User.objects.create_user(email='owner2@domipyme.com', password='P@ssw0rd!2025', is_merchant=True)
    admin = User.objects.create_user(email='admin@domipyme.com', password='P@ssw0rd!2025', is_staff=True)
    shop = Shop.objects.create(owner=owner, name='Tienda Admin')
    client = APIClient()
    client.force_authenticate(admin)
    url = reverse('shop-detail', args=[shop.pk])
    data = {'name': 'Actualizada por admin'}
    resp = client.put(url, data)
    assert resp.status_code == 200
    assert resp.data['name'] == 'Actualizada por admin'
