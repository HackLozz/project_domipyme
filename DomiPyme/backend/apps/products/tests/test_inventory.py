"""
Pytest tests for inventory management functionality.
Tests cover:
- Update stock endpoint
- Toggle active endpoint
- Low stock products endpoint
- Permissions validation
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.shops.models import Shop, Product
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
def other_merchant(db):
    """Create another merchant user."""
    return User.objects.create_user(
        email='other@test.com',
        password='testpass123',
        is_merchant=True,
        first_name='Other',
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
def shop(merchant_user):
    """Create a shop owned by merchant."""
    return Shop.objects.create(
        name='Test Shop',
        owner=merchant_user,
        description='Test description',
        address='123 Main St'
    )


@pytest.fixture
def other_shop(other_merchant):
    """Create a shop owned by other merchant."""
    return Shop.objects.create(
        name='Other Shop',
        owner=other_merchant,
        description='Other description',
        address='456 Other St'
    )


@pytest.fixture
def product(shop):
    """Create a product with normal stock."""
    return Product.objects.create(
        shop=shop,
        name='Test Product',
        description='Test description',
        price=Decimal('100.00'),
        stock=50,
        active=True
    )


@pytest.fixture
def low_stock_product(shop):
    """Create a product with low stock."""
    return Product.objects.create(
        shop=shop,
        name='Low Stock Product',
        description='Running out',
        price=Decimal('50.00'),
        stock=5,
        active=True
    )


@pytest.fixture
def out_of_stock_product(shop):
    """Create an out of stock product."""
    return Product.objects.create(
        shop=shop,
        name='Out of Stock',
        description='No stock',
        price=Decimal('25.00'),
        stock=0,
        active=True
    )


# --- Update Stock Tests ---
@pytest.mark.django_db
def test_update_stock_success(api_client, merchant_user, product):
    """Merchant can update stock of their product."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.patch(f'/api/products/{product.id}/update-stock/', {'stock': 100})
    assert response.status_code == 200
    product.refresh_from_db()
    assert product.stock == 100


@pytest.mark.django_db
def test_update_stock_to_zero(api_client, merchant_user, product):
    """Can set stock to zero."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.patch(f'/api/products/{product.id}/update-stock/', {'stock': 0})
    assert response.status_code == 200
    product.refresh_from_db()
    assert product.stock == 0


@pytest.mark.django_db
def test_update_stock_negative(api_client, merchant_user, product):
    """Cannot set stock to negative value."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.patch(f'/api/products/{product.id}/update-stock/', {'stock': -5})
    assert response.status_code == 400
    data = response.json()
    assert 'error' in data


@pytest.mark.django_db
def test_update_stock_invalid_value(api_client, merchant_user, product):
    """Invalid stock value returns error."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.patch(f'/api/products/{product.id}/update-stock/', {'stock': 'invalid'})
    assert response.status_code == 400


@pytest.mark.django_db
def test_update_stock_missing_field(api_client, merchant_user, product):
    """Missing stock field returns error."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.patch(f'/api/products/{product.id}/update-stock/', {})
    assert response.status_code == 400


@pytest.mark.django_db
def test_update_stock_wrong_owner(api_client, merchant_user, other_merchant, other_shop):
    """Merchant cannot update stock of other merchant's product."""
    other_product = Product.objects.create(
        shop=other_shop,
        name='Other Product',
        price=Decimal('50.00'),
        stock=10,
        active=True
    )
    api_client.force_authenticate(user=merchant_user)
    response = api_client.patch(f'/api/products/{other_product.id}/update-stock/', {'stock': 100})
    assert response.status_code == 403


@pytest.mark.django_db
def test_update_stock_customer_denied(api_client, customer_user, product):
    """Customer cannot update stock."""
    api_client.force_authenticate(user=customer_user)
    response = api_client.patch(f'/api/products/{product.id}/update-stock/', {'stock': 100})
    assert response.status_code == 403


@pytest.mark.django_db
def test_update_stock_unauthenticated(api_client, product):
    """Unauthenticated request denied."""
    response = api_client.patch(f'/api/products/{product.id}/update-stock/', {'stock': 100})
    assert response.status_code == 401


# --- Toggle Active Tests ---
@pytest.mark.django_db
def test_toggle_active_explicit_true(api_client, merchant_user, product):
    """Can explicitly set active to true."""
    product.active = False
    product.save()
    
    api_client.force_authenticate(user=merchant_user)
    response = api_client.patch(f'/api/products/{product.id}/toggle-active/', {'active': True})
    assert response.status_code == 200
    product.refresh_from_db()
    assert product.active is True


@pytest.mark.django_db
def test_toggle_active_explicit_false(api_client, merchant_user, product):
    """Can explicitly set active to false."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.patch(f'/api/products/{product.id}/toggle-active/', {'active': False})
    assert response.status_code == 200
    product.refresh_from_db()
    assert product.active is False


@pytest.mark.django_db
def test_toggle_active_no_param(api_client, merchant_user, product):
    """Toggle without parameter flips the state."""
    original_state = product.active
    api_client.force_authenticate(user=merchant_user)
    response = api_client.patch(f'/api/products/{product.id}/toggle-active/', {})
    assert response.status_code == 200
    product.refresh_from_db()
    assert product.active is not original_state


@pytest.mark.django_db
def test_toggle_active_wrong_owner(api_client, merchant_user, other_shop):
    """Merchant cannot toggle active of other merchant's product."""
    other_product = Product.objects.create(
        shop=other_shop,
        name='Other Product',
        price=Decimal('50.00'),
        stock=10,
        active=True
    )
    api_client.force_authenticate(user=merchant_user)
    response = api_client.patch(f'/api/products/{other_product.id}/toggle-active/', {'active': False})
    assert response.status_code == 403


@pytest.mark.django_db
def test_toggle_active_customer_denied(api_client, customer_user, product):
    """Customer cannot toggle active."""
    api_client.force_authenticate(user=customer_user)
    response = api_client.patch(f'/api/products/{product.id}/toggle-active/', {'active': False})
    assert response.status_code == 403


# --- Low Stock Tests ---
@pytest.mark.django_db
def test_low_stock_default_threshold(api_client, merchant_user, product, low_stock_product, out_of_stock_product):
    """Returns products with stock <= 10 (default threshold)."""
    api_client.force_authenticate(user=merchant_user)
    response = api_client.get('/api/products/low-stock/')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    
    # Should include low-stock (5) and out_of_stock (0), not product (50)
    assert len(results) == 2
    stocks = [r['stock'] for r in results]
    assert all(s <= 10 for s in stocks)


@pytest.mark.django_db
def test_low_stock_custom_threshold(api_client, merchant_user, product, low_stock_product):
    """Can specify custom threshold."""
    # Set product stock to 20
    product.stock = 20
    product.save()
    
    api_client.force_authenticate(user=merchant_user)
    response = api_client.get('/api/products/low-stock/?threshold=25')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    
    # Should include both products (20 and 5)
    assert len(results) == 2


@pytest.mark.django_db
def test_low_stock_only_active_products(api_client, merchant_user, shop):
    """Only returns active products."""
    active_low = Product.objects.create(
        shop=shop,
        name='Active Low',
        price=Decimal('10.00'),
        stock=5,
        active=True
    )
    inactive_low = Product.objects.create(
        shop=shop,
        name='Inactive Low',
        price=Decimal('10.00'),
        stock=3,
        active=False
    )
    
    api_client.force_authenticate(user=merchant_user)
    response = api_client.get('/api/products/low-stock/')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    
    product_ids = [r['id'] for r in results]
    assert active_low.id in product_ids
    assert inactive_low.id not in product_ids


@pytest.mark.django_db
def test_low_stock_only_own_products(api_client, merchant_user, other_merchant, shop, other_shop):
    """Merchant only sees their own low stock products."""
    my_low = Product.objects.create(
        shop=shop,
        name='My Low',
        price=Decimal('10.00'),
        stock=5,
        active=True
    )
    other_low = Product.objects.create(
        shop=other_shop,
        name='Other Low',
        price=Decimal('10.00'),
        stock=3,
        active=True
    )
    
    api_client.force_authenticate(user=merchant_user)
    response = api_client.get('/api/products/low-stock/')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    
    product_ids = [r['id'] for r in results]
    assert my_low.id in product_ids
    assert other_low.id not in product_ids


@pytest.mark.django_db
def test_low_stock_sorted_by_stock(api_client, merchant_user, shop):
    """Results are sorted by stock (lowest first)."""
    p1 = Product.objects.create(shop=shop, name='P1', price=Decimal('10'), stock=8, active=True)
    p2 = Product.objects.create(shop=shop, name='P2', price=Decimal('10'), stock=2, active=True)
    p3 = Product.objects.create(shop=shop, name='P3', price=Decimal('10'), stock=5, active=True)
    
    api_client.force_authenticate(user=merchant_user)
    response = api_client.get('/api/products/low-stock/')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    
    stocks = [r['stock'] for r in results]
    assert stocks == sorted(stocks)  # Should be in ascending order


@pytest.mark.django_db
def test_low_stock_customer_no_products(api_client, customer_user, shop):
    """Customer has no shops, so no low stock products."""
    Product.objects.create(shop=shop, name='Low', price=Decimal('10'), stock=5, active=True)
    
    api_client.force_authenticate(user=customer_user)
    response = api_client.get('/api/products/low-stock/')
    assert response.status_code == 403  # PermissionDenied for non-merchants


@pytest.mark.django_db
def test_low_stock_unauthenticated(api_client):
    """Unauthenticated request denied."""
    response = api_client.get('/api/products/low-stock/')
    assert response.status_code == 401
