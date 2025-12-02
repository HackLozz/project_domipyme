"""
Tests para el CRUD de Shops con validación de permisos.
"""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.shops.models import Shop

User = get_user_model()


@pytest.fixture
def merchant_user():
    return User.objects.create_user(
        email='merchant@example.com',
        password='MerchantPass123!',
        is_merchant=True
    )


@pytest.fixture
def other_merchant():
    return User.objects.create_user(
        email='other@example.com',
        password='OtherPass123!',
        is_merchant=True
    )


@pytest.fixture
def regular_user():
    return User.objects.create_user(
        email='customer@example.com',
        password='CustomerPass123!',
        is_merchant=False
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


@pytest.mark.django_db
class TestShopListCreate:
    """Tests para listar y crear shops."""
    
    def test_list_shops_anonymous(self):
        """Anonymous users pueden ver shops públicas."""
        client = APIClient()
        url = reverse('shop-list')
        response = client.get(url)
        
        assert response.status_code == 200
        assert isinstance(response.data, list) or 'results' in response.data
    
    def test_create_shop_authenticated_merchant(self, merchant_user):
        """Merchant autenticado puede crear shop."""
        client = APIClient()
        client.force_authenticate(user=merchant_user)
        
        url = reverse('shop-list')
        data = {
            'name': 'New Shop',
            'slug': 'new-shop',
            'description': 'New shop description'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == 201
        assert response.data['name'] == 'New Shop'
        assert response.data['slug'] == 'new-shop'
        assert Shop.objects.filter(slug='new-shop').exists()
    
    def test_create_shop_non_merchant_forbidden(self, regular_user):
        """Usuario no-merchant no puede crear shop."""
        client = APIClient()
        client.force_authenticate(user=regular_user)
        
        url = reverse('shop-list')
        data = {
            'name': 'New Shop',
            'slug': 'new-shop',
            'description': 'Description'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == 403
    
    def test_create_shop_anonymous_forbidden(self):
        """Anonymous user no puede crear shop."""
        client = APIClient()
        
        url = reverse('shop-list')
        data = {
            'name': 'New Shop',
            'slug': 'new-shop',
            'description': 'Description'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == 401


@pytest.mark.django_db
class TestShopDetail:
    """Tests para detalle, actualización y eliminación de shops."""
    
    def test_retrieve_shop(self, shop):
        """Cualquiera puede ver detalle de shop."""
        client = APIClient()
        url = reverse('shop-detail', args=[shop.pk])
        response = client.get(url)
        
        assert response.status_code == 200
        assert response.data['name'] == shop.name
        assert response.data['slug'] == shop.slug
    
    def test_update_own_shop(self, merchant_user, shop):
        """Owner puede actualizar su shop."""
        client = APIClient()
        client.force_authenticate(user=merchant_user)
        
        url = reverse('shop-detail', args=[shop.pk])
        data = {'name': 'Updated Shop Name'}
        response = client.patch(url, data, format='json')
        
        assert response.status_code == 200
        assert response.data['name'] == 'Updated Shop Name'
        shop.refresh_from_db()
        assert shop.name == 'Updated Shop Name'
    
    def test_update_other_shop_forbidden(self, other_merchant, shop):
        """Otro merchant no puede actualizar shop ajena."""
        client = APIClient()
        client.force_authenticate(user=other_merchant)
        
        url = reverse('shop-detail', args=[shop.pk])
        data = {'name': 'Hacked Name'}
        response = client.patch(url, data, format='json')
        
        assert response.status_code == 403
    
    def test_delete_own_shop(self, merchant_user, shop):
        """Owner puede eliminar su shop."""
        client = APIClient()
        client.force_authenticate(user=merchant_user)
        
        url = reverse('shop-detail', args=[shop.pk])
        response = client.delete(url)
        
        assert response.status_code == 204
        assert not Shop.objects.filter(pk=shop.pk).exists()
    
    def test_delete_other_shop_forbidden(self, other_merchant, shop):
        """Otro merchant no puede eliminar shop ajena."""
        client = APIClient()
        client.force_authenticate(user=other_merchant)
        
        url = reverse('shop-detail', args=[shop.pk])
        response = client.delete(url)
        
        assert response.status_code == 403
        assert Shop.objects.filter(pk=shop.pk).exists()


@pytest.mark.django_db
class TestShopSlugUniqueness:
    """Tests para validar unicidad de slug."""
    
    def test_duplicate_slug_rejected(self, merchant_user, shop):
        """No se puede crear shop con slug duplicado."""
        client = APIClient()
        client.force_authenticate(user=merchant_user)
        
        url = reverse('shop-list')
        data = {
            'name': 'Another Shop',
            'slug': shop.slug,  # mismo slug que shop existente
            'description': 'Description'
        }
        response = client.post(url, data, format='json')
        
        assert response.status_code == 400
        assert 'slug' in response.data
