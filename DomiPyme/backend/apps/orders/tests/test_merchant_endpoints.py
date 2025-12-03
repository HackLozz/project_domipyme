"""
Pytest test suite for merchant-specific order endpoints.
Tests cover:
- Merchant orders endpoint (GET /api/orders/merchant/my/)
- Merchant stats endpoint (GET /api/orders/merchant/stats/)
- Order status transitions (PUT /api/orders/<id>/status/)
- Permissions and validations
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.shops.models import Shop, Product
from apps.orders.models import Order, OrderItem
from decimal import Decimal

User = get_user_model()


@pytest.fixture
def api_client():
    """Return an unauthenticated API client."""
    return APIClient()


@pytest.fixture
def merchant_user(db):
    """Create a merchant user."""
    return User.objects.create_user(
        email='merchant@test.com',
        password='testpass123',
        is_merchant=True,
        first_name='Test',
        last_name='Merchant'
    )


@pytest.fixture
def customer_user(db):
    """Create a customer user."""
    return User.objects.create_user(
        email='customer@test.com',
        password='testpass123',
        first_name='Test',
        last_name='Customer'
    )


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return User.objects.create_user(
        email='admin@test.com',
        password='testpass123',
        is_staff=True,
        is_superuser=True,
        first_name='Test',
        last_name='Admin'
    )


@pytest.fixture
def merchant_shop(merchant_user):
    """Create a shop owned by merchant."""
    return Shop.objects.create(
        name='Test Shop',
        owner=merchant_user,
        description='Test description',
        address='Test address'
    )


@pytest.fixture
def product(merchant_shop):
    """Create a product in merchant shop."""
    return Product.objects.create(
        name='Test Product',
        description='Test description',
        price=Decimal('10.00'),
        stock=100,
        shop=merchant_shop
    )


@pytest.fixture
def order_pending(merchant_shop, customer_user, product):
    """Create a pending order for merchant shop."""
    order = Order.objects.create(
        customer=customer_user,
        shop=merchant_shop,
        total=Decimal('20.00'),
        status='pending',
        payment_confirmed=False
    )
    OrderItem.objects.create(
        order=order,
        product=product,
        quantity=2,
        price=Decimal('10.00')
    )
    return order


@pytest.fixture
def order_paid(merchant_shop, customer_user, product):
    """Create a paid order for merchant shop."""
    order = Order.objects.create(
        customer=customer_user,
        shop=merchant_shop,
        total=Decimal('30.00'),
        status='paid',
        payment_confirmed=True
    )
    OrderItem.objects.create(
        order=order,
        product=product,
        quantity=3,
        price=Decimal('10.00')
    )
    return order


# --- Tests for GET /api/orders/merchant/my/ ---
@pytest.mark.django_db
def test_merchant_my_orders_authenticated(api_client, merchant_user, order_pending, order_paid):
    """Merchant can fetch their shop orders."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.get('/api/orders/merchant/my/')
    assert response.status_code == 200
    data = response.json()
    # Should return paginated results or list
    if isinstance(data, dict):
        results = data.get('results', [])
    else:
        results = data
    assert len(results) == 2
    order_ids = [o['id'] for o in results]
    assert order_pending.id in order_ids
    assert order_paid.id in order_ids


@pytest.mark.django_db
def test_merchant_my_orders_unauthorized(api_client, customer_user, order_pending):
    """Customer cannot access merchant orders endpoint."""
    api_client.force_authenticate(user=customer_user)
    response = api_client.get('/api/orders/merchant/my/')
    # Endpoint requires merchant or admin role
    # Expecting 403 or 0 results depending on permissions implementation
    # If permissions block, 403; if filtered by shop ownership, empty list
    data = response.json()
    if response.status_code == 200:
        results = data.get('results', []) if isinstance(data, dict) else data
        assert len(results) == 0
    else:
        assert response.status_code in [403, 401]


@pytest.mark.django_db
def test_merchant_my_orders_no_auth(api_client):
    """Unauthenticated request returns 401."""
    response = api_client.get('/api/orders/merchant/my/')
    assert response.status_code == 401


# --- Tests for GET /api/orders/merchant/stats/ ---
@pytest.mark.django_db
def test_merchant_stats_returns_correct_counts(api_client, merchant_user, order_pending, order_paid):
    """Merchant stats endpoint returns accurate totals."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.get('/api/orders/merchant/stats/')
    assert response.status_code == 200
    data = response.json()
    assert data['total'] == 2
    assert data['pending'] == 1
    assert data['approved'] == 1
    assert data['delivered'] == 0
    assert 'revenue_total' in data
    assert 'revenue_approved' in data
    assert Decimal(data['revenue_total']) == Decimal('50.00')  # 20 + 30
    assert Decimal(data['revenue_approved']) == Decimal('30.00')  # only paid order


@pytest.mark.django_db
def test_merchant_stats_empty_shop(api_client, merchant_user, merchant_shop):
    """Stats return zeros for shop with no orders."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.get('/api/orders/merchant/stats/')
    assert response.status_code == 200
    data = response.json()
    assert data['total'] == 0
    assert data['pending'] == 0
    assert data['approved'] == 0
    assert Decimal(data['revenue_total']) == Decimal('0')
    assert Decimal(data['revenue_approved']) == Decimal('0')


@pytest.mark.django_db
def test_merchant_stats_no_auth(api_client):
    """Unauthenticated request to stats returns 401."""
    response = api_client.get('/api/orders/merchant/stats/')
    assert response.status_code == 401


# --- Tests for PUT /api/orders/<id>/status/ ---
@pytest.mark.django_db
def test_order_status_update_valid_transition(api_client, merchant_user, order_pending):
    """Valid transition pending→paid succeeds and sets payment_confirmed."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.put(f'/api/orders/{order_pending.id}/status/', {'status': 'paid'})
    assert response.status_code == 200
    order_pending.refresh_from_db()
    assert order_pending.status == 'paid'
    assert order_pending.payment_confirmed is True


@pytest.mark.django_db
def test_order_status_update_invalid_transition(api_client, merchant_user, order_pending):
    """Invalid transition pending→delivered fails."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.put(f'/api/orders/{order_pending.id}/status/', {'status': 'delivered'})
    assert response.status_code == 400
    data = response.json()
    assert 'error' in data or 'detail' in data


@pytest.mark.django_db
def test_order_status_update_permission_denied(api_client, customer_user, order_pending):
    """Customer cannot update order status."""
    api_client.force_authenticate(user=customer_user)
    response = api_client.put(f'/api/orders/{order_pending.id}/status/', {'status': 'paid'})
    assert response.status_code in [403, 400]


@pytest.mark.django_db
def test_order_status_update_admin_allowed(api_client, admin_user, order_pending):
    """Admin can update any order status."""
    api_client.force_authenticate(user=admin_user)
    response = api_client.put(f'/api/orders/{order_pending.id}/status/', {'status': 'paid'})
    assert response.status_code == 200
    order_pending.refresh_from_db()
    assert order_pending.status == 'paid'


@pytest.mark.django_db
def test_order_status_update_merchant_cannot_update_others_shop(api_client, merchant_user, customer_user, product):
    """Merchant cannot update order from another shop."""
    other_merchant = User.objects.create_user(
        email='other@test.com',
        password='testpass123',
        is_merchant=True,
        first_name='Other',
        last_name='Merchant'
    )
    other_shop = Shop.objects.create(
        name='Other Shop',
        owner=other_merchant,
        description='Other description',
        address='Other address'
    )
    other_order = Order.objects.create(
        customer=customer_user,
        shop=other_shop,
        total=Decimal('10.00'),
        status='pending',
        payment_confirmed=False
    )
    api_client.force_authenticate(user=merchant_user)
    response = api_client.put(f'/api/orders/{other_order.id}/status/', {'status': 'paid'})
    assert response.status_code in [403, 400, 404]


@pytest.mark.django_db
def test_order_status_cancel_from_pending(api_client, merchant_user, order_pending):
    """Order can be cancelled from pending status."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.put(f'/api/orders/{order_pending.id}/status/', {'status': 'cancelled'})
    assert response.status_code == 200
    order_pending.refresh_from_db()
    assert order_pending.status == 'cancelled'


@pytest.mark.django_db
def test_order_status_transition_paid_to_preparing(api_client, merchant_user, order_paid):
    """Transition paid→preparing succeeds."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.put(f'/api/orders/{order_paid.id}/status/', {'status': 'preparing'})
    assert response.status_code == 200
    order_paid.refresh_from_db()
    assert order_paid.status == 'preparing'


@pytest.mark.django_db
def test_order_status_no_auth(api_client, order_pending):
    """Unauthenticated request to update status returns 401."""
    response = api_client.put(f'/api/orders/{order_pending.id}/status/', {'status': 'paid'})
    assert response.status_code == 401
