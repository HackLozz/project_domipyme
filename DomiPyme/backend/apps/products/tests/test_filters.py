"""
Pytest tests for search and filters functionality.
Tests cover:
- Product search by name and description
- Price range filters (min/max)
- Stock availability filter
- Shop search
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.shops.models import Shop, Product, Category
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
def shop(merchant_user):
    """Create a shop."""
    return Shop.objects.create(
        name='Electronics Store',
        owner=merchant_user,
        description='Best electronics in town',
        address='123 Main St'
    )


@pytest.fixture
def category(shop):
    """Create a category."""
    return Category.objects.create(
        shop=shop,
        name='Electronics'
    )


@pytest.fixture
def products(shop, category):
    """Create multiple products for testing filters."""
    return [
        Product.objects.create(
            shop=shop,
            category=category,
            name='Laptop Pro',
            description='High-end laptop for professionals',
            price=Decimal('1500.00'),
            stock=10,
            active=True
        ),
        Product.objects.create(
            shop=shop,
            category=category,
            name='Gaming Mouse',
            description='RGB gaming mouse with precision sensor',
            price=Decimal('50.00'),
            stock=25,
            active=True
        ),
        Product.objects.create(
            shop=shop,
            category=category,
            name='Wireless Keyboard',
            description='Mechanical keyboard with wireless connectivity',
            price=Decimal('120.00'),
            stock=0,  # Out of stock
            active=True
        ),
        Product.objects.create(
            shop=shop,
            category=category,
            name='USB Cable',
            description='High-speed USB-C cable',
            price=Decimal('15.00'),
            stock=100,
            active=True
        ),
    ]


# --- Product Search Tests ---
@pytest.mark.django_db
def test_product_search_by_name(api_client, products):
    """Search products by name."""
    response = api_client.get('/api/products/?search=laptop')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 1
    assert results[0]['name'] == 'Laptop Pro'


@pytest.mark.django_db
def test_product_search_by_description(api_client, products):
    """Search products by description."""
    response = api_client.get('/api/products/?search=gaming')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 1
    assert 'Mouse' in results[0]['name']


@pytest.mark.django_db
def test_product_search_case_insensitive(api_client, products):
    """Search should be case insensitive."""
    response = api_client.get('/api/products/?search=LAPTOP')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 1


@pytest.mark.django_db
def test_product_search_partial_match(api_client, products):
    """Search should match partial strings."""
    response = api_client.get('/api/products/?search=key')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 1
    assert 'Keyboard' in results[0]['name']


# --- Price Filter Tests ---
@pytest.mark.django_db
def test_product_filter_price_min(api_client, products):
    """Filter products by minimum price."""
    response = api_client.get('/api/products/?price_min=100')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 2  # Laptop and Keyboard
    prices = [Decimal(r['price']) for r in results]
    assert all(p >= Decimal('100') for p in prices)


@pytest.mark.django_db
def test_product_filter_price_max(api_client, products):
    """Filter products by maximum price."""
    response = api_client.get('/api/products/?price_max=100')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 2  # Mouse and Cable
    prices = [Decimal(r['price']) for r in results]
    assert all(p <= Decimal('100') for p in prices)


@pytest.mark.django_db
def test_product_filter_price_range(api_client, products):
    """Filter products by price range (min and max)."""
    response = api_client.get('/api/products/?price_min=50&price_max=150')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 2  # Mouse and Keyboard
    prices = [Decimal(r['price']) for r in results]
    assert all(Decimal('50') <= p <= Decimal('150') for p in prices)


# --- Stock Filter Tests ---
@pytest.mark.django_db
def test_product_filter_in_stock(api_client, products):
    """Filter to show only products in stock."""
    response = api_client.get('/api/products/?in_stock=true')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 3  # All except Keyboard (stock=0)
    for product in results:
        assert product['stock'] > 0


@pytest.mark.django_db
def test_product_filter_in_stock_false(api_client, products):
    """Without in_stock filter, should return all products."""
    response = api_client.get('/api/products/')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 4  # All products


# --- Combined Filters Tests ---
@pytest.mark.django_db
def test_product_combined_filters(api_client, products):
    """Combine search, price range, and stock filters."""
    response = api_client.get('/api/products/?search=usb&price_min=10&price_max=20&in_stock=true')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 1
    assert results[0]['name'] == 'USB Cable'
    assert Decimal(results[0]['price']) == Decimal('15.00')
    assert results[0]['stock'] > 0


# --- Shop Search Tests ---
@pytest.mark.django_db
def test_shop_search_by_name(api_client, shop):
    """Search shops by name."""
    response = api_client.get('/api/shops/?search=electronics')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) >= 1
    assert any('Electronics' in s['name'] for s in results)


@pytest.mark.django_db
def test_shop_search_by_description(api_client, shop):
    """Search shops by description."""
    # First verify the shop exists
    assert shop.description == 'Best electronics in town'
    assert shop.active is True
    
    # Then search by partial description
    response = api_client.get('/api/shops/?search=electronics')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    # Should find at least the test shop
    assert len(results) >= 1
    found = any(s['id'] == shop.id for s in results)
    assert found, f"Shop {shop.id} not found in results"


@pytest.mark.django_db
def test_shop_search_case_insensitive(api_client, shop):
    """Shop search should be case insensitive."""
    response = api_client.get('/api/shops/?search=ELECTRONICS')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) >= 1


# --- Category Filter Tests ---
@pytest.mark.django_db
def test_product_filter_by_category(api_client, products, category):
    """Filter products by category."""
    response = api_client.get(f'/api/products/?category={category.id}')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 4  # All products have this category


@pytest.mark.django_db
def test_product_filter_by_shop(api_client, products, shop):
    """Filter products by shop."""
    response = api_client.get(f'/api/products/?shop={shop.id}')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 4  # All products belong to this shop


# --- Edge Cases ---
@pytest.mark.django_db
def test_product_search_no_results(api_client, products):
    """Search with no matching results."""
    response = api_client.get('/api/products/?search=nonexistent')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 0


@pytest.mark.django_db
def test_product_filter_invalid_price(api_client, products):
    """Invalid price values should be ignored."""
    response = api_client.get('/api/products/?price_min=invalid')
    assert response.status_code == 200  # Should not error, just ignore invalid param


@pytest.mark.django_db
def test_product_empty_search(api_client, products):
    """Empty search should return all products."""
    response = api_client.get('/api/products/?search=')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data) if isinstance(data, dict) else data
    assert len(results) == 4
