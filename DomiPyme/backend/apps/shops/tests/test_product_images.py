# backend/apps/shops/tests/test_product_images.py
import pytest
import os
from io import BytesIO
from PIL import Image as PILImage
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.shops.models import Shop, Product, ProductImage

User = get_user_model()


def create_test_image(name='test.jpg', size=(100, 100), color='red'):
    """Helper para crear una imagen de prueba"""
    file = BytesIO()
    image = PILImage.new('RGB', size, color)
    image.save(file, 'JPEG')
    file.seek(0)
    return SimpleUploadedFile(name, file.read(), content_type='image/jpeg')


@pytest.mark.django_db
class TestProductImageViewSet:
    """Tests para el ProductImageViewSet - Gestión de múltiples imágenes"""

    @pytest.fixture
    def setup_data(self):
        """Fixture para crear usuarios, tienda y producto"""
        # Usuario merchant
        merchant = User.objects.create_user(
            email='merchant@test.com',
            password='pass123',
            first_name='Merchant',
            last_name='Test',
            is_merchant=True
        )
        
        # Usuario no propietario
        other_merchant = User.objects.create_user(
            email='other@test.com',
            password='pass123',
            first_name='Other',
            last_name='Merchant',
            is_merchant=True
        )
        
        # Tienda
        shop = Shop.objects.create(
            name='Test Shop',
            owner=merchant,
            description='Test shop',
            active=True
        )
        
        # Producto
        product = Product.objects.create(
            shop=shop,
            name='Test Product',
            description='Test product description',
            price=100.00,
            stock=10,
            active=True
        )
        
        # Imágenes de prueba
        img1 = ProductImage.objects.create(
            product=product,
            image=create_test_image('img1.jpg'),
            alt_text='Image 1',
            is_primary=True,
            order=0
        )
        
        img2 = ProductImage.objects.create(
            product=product,
            image=create_test_image('img2.jpg', color='blue'),
            alt_text='Image 2',
            is_primary=False,
            order=1
        )
        
        return {
            'merchant': merchant,
            'other_merchant': other_merchant,
            'shop': shop,
            'product': product,
            'img1': img1,
            'img2': img2,
        }

    def test_list_images_public(self, setup_data):
        """Test: Cualquiera puede listar imágenes (público)"""
        client = APIClient()
        
        response = client.get('/api/product-images/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_list_images_filter_by_product(self, setup_data):
        """Test: Filtrar imágenes por product_id"""
        client = APIClient()
        product = setup_data['product']
        
        response = client.get(f'/api/product-images/?product={product.id}')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2

    def test_create_image_merchant_success(self, setup_data):
        """Test: Merchant puede agregar imagen a su producto"""
        client = APIClient()
        merchant = setup_data['merchant']
        product = setup_data['product']
        client.force_authenticate(user=merchant)
        
        image_file = create_test_image('new_image.jpg', color='green')
        data = {
            'product': product.id,
            'image': image_file,
            'alt_text': 'New Image',
            'order': 2
        }
        
        response = client.post('/api/product-images/', data, format='multipart')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['alt_text'] == 'New Image'
        assert response.data['order'] == 2
        assert 'image_url' in response.data
        
        # Verificar que se creó en DB
        assert ProductImage.objects.filter(product=product).count() == 3

    def test_create_image_unauthenticated(self, setup_data):
        """Test: Usuario no autenticado no puede agregar imágenes"""
        client = APIClient()
        product = setup_data['product']
        
        image_file = create_test_image('unauthorized.jpg')
        data = {
            'product': product.id,
            'image': image_file,
        }
        
        response = client.post('/api/product-images/', data, format='multipart')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_image_not_owner(self, setup_data):
        """Test: Merchant no puede agregar imagen a producto ajeno"""
        client = APIClient()
        other_merchant = setup_data['other_merchant']
        product = setup_data['product']
        client.force_authenticate(user=other_merchant)
        
        image_file = create_test_image('unauthorized.jpg')
        data = {
            'product': product.id,
            'image': image_file,
        }
        
        response = client.post('/api/product-images/', data, format='multipart')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_image_owner_success(self, setup_data):
        """Test: Merchant puede actualizar su imagen"""
        client = APIClient()
        merchant = setup_data['merchant']
        img1 = setup_data['img1']
        client.force_authenticate(user=merchant)
        
        data = {
            'alt_text': 'Updated Alt Text',
            'order': 5,
        }
        
        response = client.patch(f'/api/product-images/{img1.id}/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['alt_text'] == 'Updated Alt Text'
        assert response.data['order'] == 5

    def test_update_image_not_owner(self, setup_data):
        """Test: Merchant no puede actualizar imagen ajena"""
        client = APIClient()
        other_merchant = setup_data['other_merchant']
        img1 = setup_data['img1']
        client.force_authenticate(user=other_merchant)
        
        data = {'alt_text': 'Hacked'}
        
        response = client.patch(f'/api/product-images/{img1.id}/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_image_owner_success(self, setup_data):
        """Test: Merchant puede eliminar su imagen"""
        client = APIClient()
        merchant = setup_data['merchant']
        img2 = setup_data['img2']
        product = setup_data['product']
        client.force_authenticate(user=merchant)
        
        response = client.delete(f'/api/product-images/{img2.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verificar que fue eliminada
        assert ProductImage.objects.filter(id=img2.id).count() == 0
        assert ProductImage.objects.filter(product=product).count() == 1

    def test_delete_image_not_owner(self, setup_data):
        """Test: Merchant no puede eliminar imagen ajena"""
        client = APIClient()
        other_merchant = setup_data['other_merchant']
        img1 = setup_data['img1']
        client.force_authenticate(user=other_merchant)
        
        response = client.delete(f'/api/product-images/{img1.id}/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_set_primary_success(self, setup_data):
        """Test: Merchant puede marcar imagen como principal"""
        client = APIClient()
        merchant = setup_data['merchant']
        img2 = setup_data['img2']
        img1 = setup_data['img1']
        client.force_authenticate(user=merchant)
        
        # img1 es primary, cambiar a img2
        response = client.post(f'/api/product-images/{img2.id}/set-primary/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_primary'] is True
        
        # Verificar que img1 ya no es primary
        img1.refresh_from_db()
        assert img1.is_primary is False

    def test_set_primary_not_owner(self, setup_data):
        """Test: Merchant no puede marcar imagen ajena como primary"""
        client = APIClient()
        other_merchant = setup_data['other_merchant']
        img2 = setup_data['img2']
        client.force_authenticate(user=other_merchant)
        
        response = client.post(f'/api/product-images/{img2.id}/set-primary/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_reorder_images_success(self, setup_data):
        """Test: Merchant puede reordenar sus imágenes"""
        client = APIClient()
        merchant = setup_data['merchant']
        img1 = setup_data['img1']
        img2 = setup_data['img2']
        client.force_authenticate(user=merchant)
        
        data = {
            'images': [
                {'id': img2.id, 'order': 0},  # img2 primero
                {'id': img1.id, 'order': 1},  # img1 segundo
            ]
        }
        
        response = client.post('/api/product-images/reorder/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Verificar orden actualizado
        img1.refresh_from_db()
        img2.refresh_from_db()
        assert img1.order == 1
        assert img2.order == 0

    def test_reorder_images_not_owner(self, setup_data):
        """Test: Merchant no puede reordenar imágenes ajenas"""
        client = APIClient()
        other_merchant = setup_data['other_merchant']
        img1 = setup_data['img1']
        client.force_authenticate(user=other_merchant)
        
        data = {
            'images': [
                {'id': img1.id, 'order': 10},
            ]
        }
        
        response = client.post('/api/product-images/reorder/', data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_bulk_upload_success(self, setup_data):
        """Test: Merchant puede subir múltiples imágenes a la vez"""
        client = APIClient()
        merchant = setup_data['merchant']
        product = setup_data['product']
        client.force_authenticate(user=merchant)
        
        img1 = create_test_image('bulk1.jpg', color='yellow')
        img2 = create_test_image('bulk2.jpg', color='purple')
        img3 = create_test_image('bulk3.jpg', color='orange')
        
        data = {
            'product': product.id,
            'images': [img1, img2, img3]
        }
        
        response = client.post('/api/product-images/bulk-upload/', data, format='multipart')
        assert response.status_code == status.HTTP_201_CREATED
        assert '3 imágenes subidas' in response.data['message']
        assert len(response.data['images']) == 3
        
        # Verificar en DB (2 originales + 3 nuevas)
        assert ProductImage.objects.filter(product=product).count() == 5

    def test_bulk_upload_not_owner(self, setup_data):
        """Test: Merchant no puede bulk upload a producto ajeno"""
        client = APIClient()
        other_merchant = setup_data['other_merchant']
        product = setup_data['product']
        client.force_authenticate(user=other_merchant)
        
        img1 = create_test_image('unauthorized.jpg')
        
        data = {
            'product': product.id,
            'images': [img1]
        }
        
        response = client.post('/api/product-images/bulk-upload/', data, format='multipart')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_first_image_auto_primary(self, setup_data):
        """Test: Primera imagen de un producto se marca automáticamente como primary"""
        client = APIClient()
        merchant = setup_data['merchant']
        shop = setup_data['shop']
        client.force_authenticate(user=merchant)
        
        # Crear nuevo producto sin imágenes
        new_product = Product.objects.create(
            shop=shop,
            name='New Product',
            price=50.00,
            stock=5,
            active=True
        )
        
        # Agregar primera imagen
        image_file = create_test_image('first.jpg')
        data = {
            'product': new_product.id,
            'image': image_file,
            'alt_text': 'First Image',
        }
        
        response = client.post('/api/product-images/', data, format='multipart')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['is_primary'] is True

    def test_product_primary_image_property(self, setup_data):
        """Test: Propiedad primary_image del producto funciona correctamente"""
        product = setup_data['product']
        img1 = setup_data['img1']
        
        primary = product.primary_image
        assert primary is not None
        assert primary.id == img1.id
        assert primary.is_primary is True

    def test_product_all_images_property(self, setup_data):
        """Test: Propiedad all_images del producto devuelve todas ordenadas"""
        product = setup_data['product']
        
        images = list(product.all_images)
        assert len(images) == 2
        assert images[0].order <= images[1].order
