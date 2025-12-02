# backend/apps/shops/tests/test_permissions.py
"""
Tests de permisos y ownership para shops y products.
"""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.shops.models import Shop, Product

User = get_user_model()


@pytest.mark.django_db
def test_merchant_can_create_shop():
    """Merchant puede crear shop."""
    client = APIClient()
    merchant = User.objects.create_user(
        email='merchant@example.com',
        password='Pass123!',
        is_merchant=True
    )
    client.force_authenticate(user=merchant)
    
    url = reverse('shop-list')
    data = {'name': 'Mi Tienda', 'description': 'Desc'}
    resp = client.post(url, data, format='json')
    
    if resp.status_code not in (200, 201):
        print(f"Error response: {resp.data}")
    assert resp.status_code in (200, 201)
    assert Shop.objects.filter(owner=merchant).exists()


@pytest.mark.django_db
def test_merchant_cannot_edit_other_shop():
    """Merchant no puede editar shop de otro."""
    client = APIClient()
    owner = User.objects.create_user(email='owner@example.com', password='Pass123!', is_merchant=True)
    other_merchant = User.objects.create_user(email='other@example.com', password='Pass123!', is_merchant=True)
    
    shop = Shop.objects.create(name='Shop Owner', slug='shop-owner', owner=owner, active=True)
    
    client.force_authenticate(user=other_merchant)
    url = reverse('shop-detail', args=[shop.pk])
    resp = client.patch(url, {'name': 'Hacked'}, format='json')
    
    # Debe rechazar (403 o 404 dependiendo de implementación)
    assert resp.status_code in (403, 404)
    shop.refresh_from_db()
    assert shop.name == 'Shop Owner'


@pytest.mark.django_db
def test_admin_can_edit_any_shop():
    """Admin puede editar cualquier shop."""
    client = APIClient()
    owner = User.objects.create_user(email='owner@example.com', password='Pass123!', is_merchant=True)
    admin = User.objects.create_user(email='admin@example.com', password='Pass123!', is_staff=True, is_superuser=True)
    
    shop = Shop.objects.create(name='Shop Owner', slug='shop-owner', owner=owner, active=True)
    
    client.force_authenticate(user=admin)
    url = reverse('shop-detail', args=[shop.pk])
    resp = client.patch(url, {'name': 'Admin Edit'}, format='json')
    
    assert resp.status_code == 200
    shop.refresh_from_db()
    assert shop.name == 'Admin Edit'


@pytest.mark.django_db
def test_product_ownership_validation():
    """Product solo puede ser creado por owner de la shop."""
    client = APIClient()
    owner = User.objects.create_user(email='owner@example.com', password='Pass123!', is_merchant=True)
    other_merchant = User.objects.create_user(email='other@example.com', password='Pass123!', is_merchant=True)
    
    shop = Shop.objects.create(name='Shop', slug='shop', owner=owner, active=True)
    
    client.force_authenticate(user=other_merchant)
    url = reverse('product-list')
    data = {'name': 'Product Hack', 'price': 10, 'shop': shop.id}
    resp = client.post(url, data, format='json')
    
    # Debe fallar
    assert resp.status_code == 403
    assert not Product.objects.filter(name='Product Hack').exists()
