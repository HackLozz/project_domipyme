# backend/apps/shops/tests/test_reviews.py
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.shops.models import Shop, Product, Review, ReviewHelpful

User = get_user_model()


@pytest.mark.django_db
class TestReviewViewSet:
    """Tests para el ReviewViewSet - Sistema de reseñas y valoraciones"""

    @pytest.fixture
    def setup_data(self):
        """Fixture para crear usuarios, tiendas y productos"""
        # Usuarios
        customer1 = User.objects.create_user(
            email='customer1@test.com',
            password='pass123',
            first_name='Customer',
            last_name='One',
            is_merchant=False
        )
        
        customer2 = User.objects.create_user(
            email='customer2@test.com',
            password='pass123',
            first_name='Customer',
            last_name='Two',
            is_merchant=False
        )
        
        merchant = User.objects.create_user(
            email='merchant@test.com',
            password='pass123',
            first_name='Merchant',
            last_name='Test',
            is_merchant=True
        )
        
        # Tienda
        shop = Shop.objects.create(
            name='Test Shop',
            owner=merchant,
            description='Test shop',
            active=True
        )
        
        # Productos
        product1 = Product.objects.create(
            shop=shop,
            name='Product 1',
            description='Test product 1',
            price=100.00,
            stock=10,
            active=True
        )
        
        product2 = Product.objects.create(
            shop=shop,
            name='Product 2',
            description='Test product 2',
            price=200.00,
            stock=5,
            active=True
        )
        
        # Reseñas
        review1 = Review.objects.create(
            product=product1,
            user=customer1,
            rating=5,
            comment='Excellent product!',
            verified_purchase=True
        )
        
        review2 = Review.objects.create(
            product=product1,
            user=customer2,
            rating=4,
            comment='Good product',
            verified_purchase=False
        )
        
        return {
            'customer1': customer1,
            'customer2': customer2,
            'merchant': merchant,
            'shop': shop,
            'product1': product1,
            'product2': product2,
            'review1': review1,
            'review2': review2,
        }

    def test_list_reviews_public(self, setup_data):
        """Test: Cualquiera puede listar reseñas (público)"""
        client = APIClient()
        
        response = client.get('/api/reviews/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_list_reviews_filter_by_product(self, setup_data):
        """Test: Filtrar reseñas por product_id"""
        client = APIClient()
        product1 = setup_data['product1']
        
        response = client.get(f'/api/reviews/?product={product1.id}')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2

    def test_list_reviews_filter_by_rating(self, setup_data):
        """Test: Filtrar reseñas por rating"""
        client = APIClient()
        product1 = setup_data['product1']
        
        response = client.get(f'/api/reviews/?product={product1.id}&rating=5')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['rating'] == 5

    def test_create_review_authenticated_success(self, setup_data):
        """Test: Usuario autenticado puede crear reseña"""
        client = APIClient()
        customer1 = setup_data['customer1']
        product2 = setup_data['product2']
        client.force_authenticate(user=customer1)
        
        data = {
            'product': product2.id,
            'rating': 5,
            'comment': 'Amazing product!'
        }
        
        response = client.post('/api/reviews/', data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['rating'] == 5
        assert response.data['comment'] == 'Amazing product!'
        assert response.data['user_email'] == 'customer1@test.com'

    def test_create_review_unauthenticated(self, setup_data):
        """Test: Usuario no autenticado no puede crear reseña"""
        client = APIClient()
        product1 = setup_data['product1']
        
        data = {
            'product': product1.id,
            'rating': 5,
            'comment': 'Great!'
        }
        
        response = client.post('/api/reviews/', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_review_duplicate(self, setup_data):
        """Test: Usuario no puede crear múltiples reseñas para el mismo producto"""
        client = APIClient()
        customer1 = setup_data['customer1']
        product1 = setup_data['product1']
        client.force_authenticate(user=customer1)
        
        # customer1 ya tiene una reseña para product1
        data = {
            'product': product1.id,
            'rating': 3,
            'comment': 'Another review'
        }
        
        response = client.post('/api/reviews/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'ya dejaste una reseña' in str(response.data).lower()

    def test_update_review_owner_success(self, setup_data):
        """Test: Usuario puede actualizar su propia reseña"""
        client = APIClient()
        customer1 = setup_data['customer1']
        review1 = setup_data['review1']
        client.force_authenticate(user=customer1)
        
        data = {
            'rating': 4,
            'comment': 'Updated: Still good but not perfect'
        }
        
        response = client.patch(f'/api/reviews/{review1.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['rating'] == 4
        assert 'Updated' in response.data['comment']

    def test_update_review_not_owner(self, setup_data):
        """Test: Usuario no puede actualizar reseña ajena"""
        client = APIClient()
        customer2 = setup_data['customer2']
        review1 = setup_data['review1']  # Pertenece a customer1
        client.force_authenticate(user=customer2)
        
        data = {'rating': 1, 'comment': 'Hacked'}
        
        response = client.patch(f'/api/reviews/{review1.id}/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_review_owner_success(self, setup_data):
        """Test: Usuario puede eliminar su propia reseña"""
        client = APIClient()
        customer2 = setup_data['customer2']
        review2 = setup_data['review2']
        client.force_authenticate(user=customer2)
        
        response = client.delete(f'/api/reviews/{review2.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verificar que fue eliminada
        assert Review.objects.filter(id=review2.id).count() == 0

    def test_delete_review_not_owner(self, setup_data):
        """Test: Usuario no puede eliminar reseña ajena"""
        client = APIClient()
        customer1 = setup_data['customer1']
        review2 = setup_data['review2']  # Pertenece a customer2
        client.force_authenticate(user=customer1)
        
        response = client.delete(f'/api/reviews/{review2.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_my_reviews(self, setup_data):
        """Test: Usuario puede obtener sus propias reseñas"""
        client = APIClient()
        customer1 = setup_data['customer1']
        client.force_authenticate(user=customer1)
        
        response = client.get('/api/reviews/my_reviews/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['user_email'] == 'customer1@test.com'

    def test_mark_helpful_toggle_on(self, setup_data):
        """Test: Usuario puede marcar reseña como útil"""
        client = APIClient()
        customer2 = setup_data['customer2']
        review1 = setup_data['review1']
        client.force_authenticate(user=customer2)
        
        initial_count = review1.helpful_count
        
        response = client.post(f'/api/reviews/{review1.id}/mark-helpful/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_helpful'] is True
        assert response.data['helpful_count'] == initial_count + 1

    def test_mark_helpful_toggle_off(self, setup_data):
        """Test: Usuario puede desmarcar reseña como útil"""
        client = APIClient()
        customer2 = setup_data['customer2']
        review1 = setup_data['review1']
        client.force_authenticate(user=customer2)
        
        # Primero marcar como útil
        ReviewHelpful.objects.create(review=review1, user=customer2)
        review1.helpful_count = 1
        review1.save()
        
        response = client.post(f'/api/reviews/{review1.id}/mark-helpful/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_helpful'] is False
        assert response.data['helpful_count'] == 0

    def test_mark_helpful_own_review(self, setup_data):
        """Test: Usuario no puede marcar su propia reseña como útil"""
        client = APIClient()
        customer1 = setup_data['customer1']
        review1 = setup_data['review1']  # Pertenece a customer1
        client.force_authenticate(user=customer1)
        
        response = client.post(f'/api/reviews/{review1.id}/mark-helpful/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'propia reseña' in str(response.data).lower()

    def test_product_reviews_endpoint(self, setup_data):
        """Test: Endpoint product-reviews devuelve reseñas de un producto"""
        client = APIClient()
        product1 = setup_data['product1']
        
        response = client.get(f'/api/reviews/product-reviews/{product1.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2

    def test_product_reviews_sort_by_helpful(self, setup_data):
        """Test: Ordenar reseñas por helpful_count"""
        client = APIClient()
        product1 = setup_data['product1']
        review2 = setup_data['review2']
        
        # Incrementar helpful_count de review2
        review2.helpful_count = 10
        review2.save()
        
        response = client.get(f'/api/reviews/product-reviews/{product1.id}/?sort=helpful')
        assert response.status_code == status.HTTP_200_OK
        # review2 debería estar primero
        assert response.data['results'][0]['id'] == review2.id

    def test_product_reviews_sort_by_rating_high(self, setup_data):
        """Test: Ordenar reseñas por rating (mayor a menor)"""
        client = APIClient()
        product1 = setup_data['product1']
        review1 = setup_data['review1']  # rating=5
        
        response = client.get(f'/api/reviews/product-reviews/{product1.id}/?sort=rating_high')
        assert response.status_code == status.HTTP_200_OK
        # review1 (5★) debería estar primero
        assert response.data['results'][0]['id'] == review1.id
        assert response.data['results'][0]['rating'] == 5

    def test_product_avg_rating(self, setup_data):
        """Test: Product.avg_rating devuelve el promedio correcto"""
        product1 = setup_data['product1']
        
        # review1=5, review2=4 -> promedio = 4.5
        avg = product1.avg_rating
        assert avg == 4.5

    def test_product_review_count(self, setup_data):
        """Test: Product.review_count devuelve el total correcto"""
        product1 = setup_data['product1']
        
        count = product1.review_count
        assert count == 2

    def test_product_rating_distribution(self, setup_data):
        """Test: Product.rating_distribution devuelve distribución correcta"""
        product1 = setup_data['product1']
        
        distribution = product1.rating_distribution
        assert distribution[5] == 1  # 1 reseña de 5★
        assert distribution[4] == 1  # 1 reseña de 4★
        assert distribution[3] == 0
        assert distribution[2] == 0
        assert distribution[1] == 0

    def test_review_unique_together_constraint(self, setup_data):
        """Test: unique_together impide múltiples reseñas del mismo usuario al mismo producto"""
        customer1 = setup_data['customer1']
        product1 = setup_data['product1']
        
        # Intentar crear segunda reseña (customer1 ya tiene una para product1)
        with pytest.raises(Exception):  # IntegrityError
            Review.objects.create(
                product=product1,
                user=customer1,
                rating=3,
                comment='Duplicate'
            )

    def test_review_helpful_unique_together(self, setup_data):
        """Test: ReviewHelpful unique_together impide votos duplicados"""
        customer2 = setup_data['customer2']
        review1 = setup_data['review1']
        
        # Crear primer voto
        ReviewHelpful.objects.create(review=review1, user=customer2)
        
        # Intentar crear segundo voto del mismo usuario
        with pytest.raises(Exception):  # IntegrityError
            ReviewHelpful.objects.create(review=review1, user=customer2)
