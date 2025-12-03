# backend/apps/shops/tests/test_categories.py
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.shops.models import Shop, Category, Product

User = get_user_model()


@pytest.mark.django_db
class TestCategoryViewSet:
    """Tests para el CategoryViewSet - CRUD de categorías"""

    @pytest.fixture
    def setup_data(self):
        """Fixture para crear usuarios, tiendas y categorías"""
        # Usuarios
        merchant1 = User.objects.create_user(
            email='merchant1@test.com',
            password='pass123',
            first_name='Merchant',
            last_name='One',
            is_merchant=True
        )
        merchant2 = User.objects.create_user(
            email='merchant2@test.com',
            password='pass123',
            first_name='Merchant',
            last_name='Two',
            is_merchant=True
        )
        customer = User.objects.create_user(
            email='customer1@test.com',
            password='pass123',
            first_name='Customer',
            last_name='One',
            is_merchant=False
        )
        
        # Tiendas
        shop1 = Shop.objects.create(
            name='Shop 1',
            owner=merchant1,
            description='Test shop 1',
            active=True
        )
        shop2 = Shop.objects.create(
            name='Shop 2',
            owner=merchant2,
            description='Test shop 2',
            active=True
        )
        
        # Categorías para shop1
        cat1 = Category.objects.create(
            shop=shop1,
            name='Electronics',
            description='Electronic products',
            active=True,
            order=0
        )
        cat2 = Category.objects.create(
            shop=shop1,
            name='Clothing',
            description='Clothes and accessories',
            active=True,
            order=1
        )
        cat3 = Category.objects.create(
            shop=shop1,
            name='Inactive Category',
            description='Inactive',
            active=False,
            order=2
        )
        
        # Categoría para shop2
        cat4 = Category.objects.create(
            shop=shop2,
            name='Books',
            description='Books and magazines',
            active=True,
            order=0
        )
        
        # Producto en cat1
        product1 = Product.objects.create(
            shop=shop1,
            name='Laptop',
            description='Gaming laptop',
            price=1200.00,
            stock=10,
            active=True,
            category=cat1
        )
        
        return {
            'merchant1': merchant1,
            'merchant2': merchant2,
            'customer': customer,
            'shop1': shop1,
            'shop2': shop2,
            'cat1': cat1,
            'cat2': cat2,
            'cat3': cat3,
            'cat4': cat4,
            'product1': product1,
        }

    def test_list_categories_public(self, setup_data):
        """Test: Cualquiera puede listar categorías (público)"""
        client = APIClient()
        
        response = client.get('/api/categories/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 4  # Total de categorías (3 + 1)

    def test_list_categories_filter_by_shop(self, setup_data):
        """Test: Filtrar categorías por shop_id"""
        client = APIClient()
        shop1 = setup_data['shop1']
        
        response = client.get(f'/api/categories/?shop={shop1.id}')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3  # 3 categorías de shop1

    def test_list_categories_filter_by_active(self, setup_data):
        """Test: Filtrar categorías activas"""
        client = APIClient()
        shop1 = setup_data['shop1']
        
        response = client.get(f'/api/categories/?shop={shop1.id}&active=true')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2  # Solo activas

    def test_by_shop_action(self, setup_data):
        """Test: Endpoint by-shop/{shop_id}/ devuelve solo activas"""
        client = APIClient()
        shop1 = setup_data['shop1']
        
        response = client.get(f'/api/categories/by-shop/{shop1.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2  # Solo las 2 activas
        for cat in response.data:
            assert cat['active'] is True

    def test_create_category_merchant_success(self, setup_data):
        """Test: Merchant puede crear categoría en su tienda"""
        client = APIClient()
        merchant1 = setup_data['merchant1']
        shop1 = setup_data['shop1']
        client.force_authenticate(user=merchant1)
        
        data = {
            'shop': shop1.id,
            'name': 'New Category',
            'description': 'New category description',
            'active': True,
            'order': 3
        }
        
        response = client.post('/api/categories/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'New Category'
        assert response.data['slug'] == 'new-category'
        assert response.data['shop_name'] == 'Shop 1'
        assert response.data['product_count'] == 0

    def test_create_category_slug_auto_generated(self, setup_data):
        """Test: Slug se genera automáticamente desde name"""
        client = APIClient()
        merchant1 = setup_data['merchant1']
        shop1 = setup_data['shop1']
        client.force_authenticate(user=merchant1)
        
        data = {
            'shop': shop1.id,
            'name': 'Category With Spaces',
            'description': 'Test slug generation',
        }
        
        response = client.post('/api/categories/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['slug'] == 'category-with-spaces'

    def test_create_category_unauthenticated(self, setup_data):
        """Test: Usuario no autenticado no puede crear categoría"""
        client = APIClient()
        shop1 = setup_data['shop1']
        
        data = {
            'shop': shop1.id,
            'name': 'Unauthorized Category',
        }
        
        response = client.post('/api/categories/', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_category_not_owner(self, setup_data):
        """Test: Merchant no puede crear categoría en tienda ajena"""
        client = APIClient()
        merchant1 = setup_data['merchant1']
        shop2 = setup_data['shop2']  # Pertenece a merchant2
        client.force_authenticate(user=merchant1)
        
        data = {
            'shop': shop2.id,
            'name': 'Unauthorized Category',
        }
        
        response = client.post('/api/categories/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_category_owner_success(self, setup_data):
        """Test: Merchant puede actualizar su categoría"""
        client = APIClient()
        merchant1 = setup_data['merchant1']
        cat1 = setup_data['cat1']
        client.force_authenticate(user=merchant1)
        
        data = {
            'name': 'Updated Electronics',
            'description': 'Updated description',
            'active': False,
        }
        
        response = client.patch(f'/api/categories/{cat1.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Electronics'
        # El slug se mantiene (solo se genera en creación)
        assert response.data['slug'] == 'electronics'
        assert response.data['active'] is False

    def test_update_category_not_owner(self, setup_data):
        """Test: Merchant no puede actualizar categoría ajena"""
        client = APIClient()
        merchant1 = setup_data['merchant1']
        cat4 = setup_data['cat4']  # Pertenece a shop2/merchant2
        client.force_authenticate(user=merchant1)
        
        data = {'name': 'Hacked Category'}
        
        response = client.patch(f'/api/categories/{cat4.id}/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_category_owner_success(self, setup_data):
        """Test: Merchant puede eliminar categoría vacía"""
        client = APIClient()
        merchant1 = setup_data['merchant1']
        cat2 = setup_data['cat2']  # Sin productos
        client.force_authenticate(user=merchant1)
        
        response = client.delete(f'/api/categories/{cat2.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verificar que fue eliminada
        assert Category.objects.filter(id=cat2.id).count() == 0

    def test_delete_category_with_products_fails(self, setup_data):
        """Test: No se puede eliminar categoría con productos"""
        client = APIClient()
        merchant1 = setup_data['merchant1']
        cat1 = setup_data['cat1']  # Tiene product1 asignado
        client.force_authenticate(user=merchant1)
        
        response = client.delete(f'/api/categories/{cat1.id}/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # response.data es una lista de errores
        error_text = str(response.data).lower()
        assert 'productos' in error_text

    def test_delete_category_not_owner(self, setup_data):
        """Test: Merchant no puede eliminar categoría ajena"""
        client = APIClient()
        merchant1 = setup_data['merchant1']
        cat4 = setup_data['cat4']  # Pertenece a merchant2
        client.force_authenticate(user=merchant1)
        
        response = client.delete(f'/api/categories/{cat4.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_reorder_categories_success(self, setup_data):
        """Test: Merchant puede reordenar sus categorías"""
        client = APIClient()
        merchant1 = setup_data['merchant1']
        cat1 = setup_data['cat1']
        cat2 = setup_data['cat2']
        client.force_authenticate(user=merchant1)
        
        data = {
            'categories': [
                {'id': cat2.id, 'order': 0},  # Clothing primero
                {'id': cat1.id, 'order': 1},  # Electronics segundo
            ]
        }
        
        response = client.post('/api/categories/reorder/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Verificar orden actualizado
        cat1.refresh_from_db()
        cat2.refresh_from_db()
        assert cat1.order == 1
        assert cat2.order == 0

    def test_reorder_categories_not_owner(self, setup_data):
        """Test: Merchant no puede reordenar categorías ajenas"""
        client = APIClient()
        merchant1 = setup_data['merchant1']
        cat4 = setup_data['cat4']  # Pertenece a merchant2
        client.force_authenticate(user=merchant1)
        
        data = {
            'categories': [
                {'id': cat4.id, 'order': 5},
            ]
        }
        
        response = client.post('/api/categories/reorder/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_product_count_property(self, setup_data):
        """Test: product_count devuelve cantidad correcta"""
        client = APIClient()
        cat1 = setup_data['cat1']
        shop1 = setup_data['shop1']
        
        # cat1 ya tiene 1 producto (product1)
        response = client.get(f'/api/categories/{cat1.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['product_count'] == 1
        
        # Agregar otro producto
        Product.objects.create(
            shop=shop1,
            name='Tablet',
            price=500.00,
            stock=5,
            active=True,
            category=cat1
        )
        
        response = client.get(f'/api/categories/{cat1.id}/')
        assert response.data['product_count'] == 2

    def test_unique_slug_per_shop(self, setup_data):
        """Test: unique_together permite mismo slug en diferentes shops"""
        client = APIClient()
        merchant1 = setup_data['merchant1']
        merchant2 = setup_data['merchant2']
        shop1 = setup_data['shop1']
        shop2 = setup_data['shop2']
        
        # merchant1 crea "Food" en shop1
        client.force_authenticate(user=merchant1)
        data1 = {
            'shop': shop1.id,
            'name': 'Food',
            'description': 'Food category in shop1',
        }
        response1 = client.post('/api/categories/', data1, format='json')
        assert response1.status_code == status.HTTP_201_CREATED
        
        # merchant2 puede crear "Food" en shop2 (diferente shop)
        client.force_authenticate(user=merchant2)
        data2 = {
            'shop': shop2.id,
            'name': 'Food',
            'description': 'Food category in shop2',
        }
        response2 = client.post('/api/categories/', data2, format='json')
        assert response2.status_code == status.HTTP_201_CREATED
        
        # Ambos tienen slug "food" pero en diferentes shops
        assert response1.data['slug'] == 'food'
        assert response2.data['slug'] == 'food'
