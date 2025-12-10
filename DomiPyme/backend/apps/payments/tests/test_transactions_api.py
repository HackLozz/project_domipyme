import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.orders.models import Order
from apps.payments.models import Transaction
from apps.shops.models import Shop

@pytest.mark.django_db
def test_create_transaction_requires_auth():
    client = APIClient()
    url = reverse('payments:transactions-list-create')
    resp = client.post(url, {})
    assert resp.status_code == 401

@pytest.mark.django_db
def test_create_transaction_validates_amount():
    User = get_user_model()
    user = User.objects.create_user(email='pay@domipyme.com', password='P@ssw0rd!2025')
    shop = Shop.objects.create(owner=user, name='Tienda1')
    order = Order.objects.create(customer=user, shop=shop)
    client = APIClient()
    client.force_authenticate(user)
    url = reverse('payments:transactions-list-create')
    data = {
        'order': order.id,
        'provider': 'payu',
        'amount': -10,
        'status': 'pending',
    }
    resp = client.post(url, data)
    assert resp.status_code == 400
    assert 'El monto debe ser mayor a cero.' in str(resp.data)

@pytest.mark.django_db
def test_create_transaction_for_other_user_forbidden():
    User = get_user_model()
    user1 = User.objects.create_user(email='u1@domipyme.com', password='P@ssw0rd!2025')
    user2 = User.objects.create_user(email='u2@domipyme.com', password='P@ssw0rd!2025')
    shop = Shop.objects.create(owner=user2, name='Tienda2')
    order = Order.objects.create(customer=user2, shop=shop)
    client = APIClient()
    client.force_authenticate(user1)
    url = reverse('payments:transactions-list-create')
    data = {
        'order': order.id,
        'provider': 'payu',
        'amount': 100,
        'status': 'pending',
    }
    resp = client.post(url, data)
    assert resp.status_code == 403
    assert 'No puedes crear pagos' in str(resp.data)

@pytest.mark.django_db
def test_create_transaction_success():
    User = get_user_model()
    user = User.objects.create_user(email='pay2@domipyme.com', password='P@ssw0rd!2025')
    shop = Shop.objects.create(owner=user, name='Tienda3')
    order = Order.objects.create(customer=user, shop=shop)
    client = APIClient()
    client.force_authenticate(user)
    url = reverse('payments:transactions-list-create')
    data = {
        'order': order.id,
        'provider': 'payu',
        'amount': 100,
        'status': 'pending',
    }
    resp = client.post(url, data)
    assert resp.status_code == 201
    assert resp.data['amount'] == '100.00'
    assert resp.data['provider'] == 'payu'
    assert resp.data['status'] == 'pending'
