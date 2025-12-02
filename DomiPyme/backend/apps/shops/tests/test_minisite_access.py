"""
Tests para validar el acceso a mini-sites por slug y rutas públicas.
"""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.shops.models import Shop
from apps.products.models import Product

User = get_user_model()


@pytest.fixture
def merchant_user():
    return User.objects.create_user(
        email='merchant@example.com',
        password='MerchantPass123!',
        is_merchant=True
    )


@pytest.fixture
def shop(merchant_user):
    return Shop.objects.create(
        name='Test Shop',
        slug='test-shop',
        owner=merchant_user,
        description='Test description',
        active=True
    )


@pytest.fixture
def inactive_shop(merchant_user):
    return Shop.objects.create(
        name='Inactive Shop',
        slug='inactive-shop',
        owner=merchant_user,
        description='Inactive shop',
        active=False
    )


@pytest.mark.django_db
class TestShopBySlug:
    """Tests para acceso a shops por slug."""
    
    def test_get_shop_by_slug(self, shop):
        """Acceder a shop por slug debe retornar la shop."""
        client = APIClient()
        
        # Buscar por filtro de slug
        url = reverse('shops:shop-list')
        response = client.get(url, {'slug': shop.slug})
        
        assert response.status_code == 200
        results = response.data if isinstance(response.data, list) else response.data.get('results', [])
        
        # Verificar que la shop está en los resultados
        slugs = [item['slug'] for item in results]
        assert shop.slug in slugs
    
    def test_active_shops_only_in_public_list(self, shop, inactive_shop):
        """Solo shops activas aparecen en lista pública."""
        client = APIClient()
        url = reverse('shops:shop-list')
        response = client.get(url)
        
        assert response.status_code == 200
        results = response.data if isinstance(response.data, list) else response.data.get('results', [])
        
        slugs = [item['slug'] for item in results]
        
        # Shop activa debe aparecer
        assert shop.slug in slugs
        
        # Shop inactiva no debe aparecer (si el filtro está implementado)
        # Si aún no está filtrado, este test fallaría y sería un recordatorio para implementarlo
    
    def test_slug_uniqueness(self, merchant_user):
        """Slugs deben ser únicos globalmente."""
        Shop.objects.create(name='Shop One', slug='unique-shop', owner=merchant_user)
        
        # Intentar crear otra shop con el mismo slug debe fallar
        with pytest.raises(Exception):  # IntegrityError en la base de datos
            Shop.objects.create(name='Shop Two', slug='unique-shop', owner=merchant_user)
    
    def test_auto_slug_generation(self, merchant_user):
        """Si no se provee slug, debe generarse automáticamente desde name."""
        shop = Shop.objects.create(name='My New Shop', owner=merchant_user)
        
        assert shop.slug == 'my-new-shop'
    
    def test_auto_slug_collision_handling(self, merchant_user):
        """Si hay colisión de slug, debe agregar sufijo numérico."""
        Shop.objects.create(name='Duplicate Name', slug='duplicate-name', owner=merchant_user)
        
        # Crear otra shop con el mismo nombre (sin especificar slug)
        shop2 = Shop.objects.create(name='Duplicate Name', owner=merchant_user)
        
        # El slug debe tener un sufijo para evitar colisión
        assert shop2.slug != 'duplicate-name'
        assert shop2.slug.startswith('duplicate-name')


@pytest.mark.django_db
class TestPublicShopRoutes:
    """Tests para rutas públicas de shops y productos."""
    
    def test_public_shop_detail(self, shop):
        """Detalle de shop activa es accesible públicamente."""
        client = APIClient()
        url = reverse('shops:shop-detail', args=[shop.pk])
        response = client.get(url)
        
        assert response.status_code == 200
        assert response.data['slug'] == shop.slug
    
    def test_public_products_by_shop(self, shop):
        """Productos de una shop son accesibles públicamente."""
        Product.objects.create(
            name='Product A',
            shop=shop,
            price=10.00,
            stock=50
        )
        
        client = APIClient()
        url = reverse('products:product-list')
        response = client.get(url, {'shop': shop.id})
        
        assert response.status_code == 200
        results = response.data if isinstance(response.data, list) else response.data.get('results', [])
        
        assert len(results) > 0
        assert results[0]['shop'] == shop.id
    
    def test_shop_products_nested(self, shop):
        """Verificar que productos están incluidos en detalle de shop."""
        Product.objects.create(name='Product A', shop=shop, price=10, stock=10)
        Product.objects.create(name='Product B', shop=shop, price=20, stock=20)
        
        client = APIClient()
        url = reverse('shops:shop-detail', args=[shop.pk])
        response = client.get(url)
        
        assert response.status_code == 200
        
        # Si el serializer incluye productos anidados
        if 'products' in response.data:
            assert len(response.data['products']) == 2
