# backend/apps/orders/tests/test_cart.py
import pytest
from decimal import Decimal
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.orders.models import Cart, CartItem
from apps.shops.models import Shop, Product

User = get_user_model()


@pytest.mark.django_db
class TestCartViewSet:
    """Tests para el CartViewSet - Sistema de carrito persistente"""

    @pytest.fixture
    def setup_data(self):
        """Fixture para crear usuarios, tiendas y productos"""
        # Usuarios
        customer = User.objects.create_user(
            email='customer@test.com',
            password='pass123',
            first_name='Customer',
            last_name='Test',
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
        
        product3 = Product.objects.create(
            shop=shop,
            name='Product 3 - No Stock',
            description='Out of stock',
            price=50.00,
            stock=0,
            active=True
        )
        
        return {
            'customer': customer,
            'merchant': merchant,
            'shop': shop,
            'product1': product1,
            'product2': product2,
            'product3': product3,
        }

    def test_get_empty_cart_anonymous(self, setup_data):
        """Test: Usuario anónimo puede obtener su carrito vacío"""
        client = APIClient()
        
        response = client.get('/api/cart/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_items'] == 0
        assert response.data['subtotal'] == '0.00'
        assert len(response.data['items']) == 0

    def test_get_empty_cart_authenticated(self, setup_data):
        """Test: Usuario autenticado puede obtener su carrito vacío"""
        client = APIClient()
        customer = setup_data['customer']
        client.force_authenticate(user=customer)
        
        response = client.get('/api/cart/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_items'] == 0
        assert response.data['subtotal'] == '0.00'

    def test_add_item_to_cart_success(self, setup_data):
        """Test: Agregar un producto al carrito exitosamente"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']
        client.force_authenticate(user=customer)
        
        data = {
            'product_id': product1.id,
            'quantity': 2
        }
        
        response = client.post('/api/cart/add-item/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_items'] == 2
        assert len(response.data['items']) == 1
        assert response.data['items'][0]['product_name'] == 'Product 1'
        assert response.data['items'][0]['quantity'] == 2

    def test_add_item_anonymous_user(self, setup_data):
        """Test: Usuario anónimo puede agregar productos al carrito"""
        client = APIClient()
        product1 = setup_data['product1']
        
        data = {
            'product_id': product1.id,
            'quantity': 1
        }
        
        response = client.post('/api/cart/add-item/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_items'] == 1
        assert response.data['items'][0]['product_id'] == product1.id

    def test_add_item_insufficient_stock(self, setup_data):
        """Test: No se puede agregar más cantidad que el stock disponible"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']  # stock=10
        client.force_authenticate(user=customer)
        
        data = {
            'product_id': product1.id,
            'quantity': 15  # Más que el stock
        }
        
        response = client.post('/api/cart/add-item/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'stock insuficiente' in str(response.data['detail']).lower()

    def test_add_item_out_of_stock(self, setup_data):
        """Test: No se puede agregar producto sin stock"""
        client = APIClient()
        customer = setup_data['customer']
        product3 = setup_data['product3']  # stock=0
        client.force_authenticate(user=customer)
        
        data = {
            'product_id': product3.id,
            'quantity': 1
        }
        
        response = client.post('/api/cart/add-item/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'stock insuficiente' in str(response.data['detail']).lower()

    def test_add_existing_item_increments_quantity(self, setup_data):
        """Test: Agregar un producto que ya está en el carrito incrementa la cantidad"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']
        client.force_authenticate(user=customer)
        
        # Agregar primera vez
        data = {'product_id': product1.id, 'quantity': 2}
        response1 = client.post('/api/cart/add-item/', data, format='json')
        assert response1.status_code == status.HTTP_200_OK
        assert response1.data['items'][0]['quantity'] == 2
        
        # Agregar segunda vez
        data = {'product_id': product1.id, 'quantity': 3}
        response2 = client.post('/api/cart/add-item/', data, format='json')
        assert response2.status_code == status.HTTP_200_OK
        assert response2.data['items'][0]['quantity'] == 5  # 2 + 3
        assert response2.data['total_items'] == 5

    def test_add_multiple_different_products(self, setup_data):
        """Test: Agregar múltiples productos diferentes al carrito"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']
        product2 = setup_data['product2']
        client.force_authenticate(user=customer)
        
        # Agregar producto 1
        response1 = client.post('/api/cart/add-item/', {'product_id': product1.id, 'quantity': 2}, format='json')
        assert response1.status_code == status.HTTP_200_OK
        
        # Agregar producto 2
        response2 = client.post('/api/cart/add-item/', {'product_id': product2.id, 'quantity': 1}, format='json')
        assert response2.status_code == status.HTTP_200_OK
        assert len(response2.data['items']) == 2
        assert response2.data['total_items'] == 3  # 2 + 1

    def test_update_cart_item_quantity(self, setup_data):
        """Test: Actualizar cantidad de un item en el carrito"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']
        client.force_authenticate(user=customer)
        
        # Agregar item
        response1 = client.post('/api/cart/add-item/', {'product_id': product1.id, 'quantity': 2}, format='json')
        item_id = response1.data['items'][0]['id']
        
        # Actualizar cantidad
        response2 = client.patch(f'/api/cart/update-item/{item_id}/', {'quantity': 5}, format='json')
        assert response2.status_code == status.HTTP_200_OK
        assert response2.data['items'][0]['quantity'] == 5
        assert response2.data['total_items'] == 5

    def test_update_item_quantity_zero_removes_item(self, setup_data):
        """Test: Actualizar cantidad a 0 elimina el item"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']
        client.force_authenticate(user=customer)
        
        # Agregar item
        response1 = client.post('/api/cart/add-item/', {'product_id': product1.id, 'quantity': 2}, format='json')
        item_id = response1.data['items'][0]['id']
        
        # Actualizar a 0
        response2 = client.patch(f'/api/cart/update-item/{item_id}/', {'quantity': 0}, format='json')
        assert response2.status_code == status.HTTP_200_OK
        assert len(response2.data['items']) == 0
        assert response2.data['total_items'] == 0

    def test_update_item_exceeds_stock(self, setup_data):
        """Test: No se puede actualizar cantidad que exceda el stock"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']  # stock=10
        client.force_authenticate(user=customer)
        
        # Agregar item
        response1 = client.post('/api/cart/add-item/', {'product_id': product1.id, 'quantity': 2}, format='json')
        item_id = response1.data['items'][0]['id']
        
        # Intentar actualizar a cantidad mayor que stock
        response2 = client.patch(f'/api/cart/update-item/{item_id}/', {'quantity': 15}, format='json')
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        assert 'stock insuficiente' in str(response2.data['detail']).lower()

    def test_remove_cart_item(self, setup_data):
        """Test: Eliminar un item del carrito"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']
        product2 = setup_data['product2']
        client.force_authenticate(user=customer)
        
        # Agregar dos items
        client.post('/api/cart/add-item/', {'product_id': product1.id, 'quantity': 2}, format='json')
        response2 = client.post('/api/cart/add-item/', {'product_id': product2.id, 'quantity': 1}, format='json')
        
        item_id = response2.data['items'][0]['id']  # Primer item
        
        # Eliminar item
        response3 = client.delete(f'/api/cart/remove-item/{item_id}/')
        assert response3.status_code == status.HTTP_200_OK
        assert len(response3.data['items']) == 1

    def test_clear_cart(self, setup_data):
        """Test: Vaciar el carrito completamente"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']
        product2 = setup_data['product2']
        client.force_authenticate(user=customer)
        
        # Agregar items
        client.post('/api/cart/add-item/', {'product_id': product1.id, 'quantity': 2}, format='json')
        client.post('/api/cart/add-item/', {'product_id': product2.id, 'quantity': 1}, format='json')
        
        # Vaciar carrito
        response = client.post('/api/cart/clear/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['items']) == 0
        assert response.data['total_items'] == 0

    def test_cart_subtotal_calculation(self, setup_data):
        """Test: Calcular subtotal del carrito correctamente"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']  # price=100
        product2 = setup_data['product2']  # price=200
        client.force_authenticate(user=customer)
        
        # Agregar items
        client.post('/api/cart/add-item/', {'product_id': product1.id, 'quantity': 2}, format='json')
        response = client.post('/api/cart/add-item/', {'product_id': product2.id, 'quantity': 1}, format='json')
        
        # Verificar subtotal: (100 * 2) + (200 * 1) = 400
        assert float(response.data['subtotal']) == 400.00

    def test_price_snapshot_on_add(self, setup_data):
        """Test: price_snapshot se captura al agregar al carrito"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']
        client.force_authenticate(user=customer)
        
        # Agregar al carrito
        response = client.post('/api/cart/add-item/', {'product_id': product1.id, 'quantity': 1}, format='json')
        
        # Verificar que price_snapshot es igual al precio actual
        assert float(response.data['items'][0]['price_snapshot']) == 100.00
        assert float(response.data['items'][0]['current_price']) == 100.00

    def test_merge_anonymous_cart_on_login(self, setup_data):
        """Test: Fusionar carrito anónimo con carrito de usuario al hacer login"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']
        product2 = setup_data['product2']
        
        # 1. Usuario anónimo agrega producto 1
        response1 = client.post('/api/cart/add-item/', {'product_id': product1.id, 'quantity': 2}, format='json')
        session_key = client.session.session_key
        
        # 2. Usuario se loguea y agrega producto 2 a su carrito
        client.force_authenticate(user=customer)
        client.post('/api/cart/add-item/', {'product_id': product2.id, 'quantity': 1}, format='json')
        
        # 3. Fusionar carrito anónimo
        response3 = client.post('cart/merge-anonymous/', {'session_key': session_key}, format='json')
        
        # 4. Verificar que ahora tiene ambos productos
        assert response3.status_code == status.HTTP_200_OK
        assert len(response3.data['items']) == 2
        assert response3.data['total_items'] == 3  # 2 + 1

    def test_merge_same_product_increments_quantity(self, setup_data):
        """Test: Fusionar carritos con el mismo producto suma las cantidades"""
        client = APIClient()
        customer = setup_data['customer']
        product1 = setup_data['product1']
        
        # 1. Usuario anónimo agrega producto 1 (cantidad 2)
        response1 = client.post('/api/cart/add-item/', {'product_id': product1.id, 'quantity': 2}, format='json')
        session_key = client.session.session_key
        
        # 2. Usuario se loguea y agrega el mismo producto (cantidad 3)
        client.force_authenticate(user=customer)
        client.post('/api/cart/add-item/', {'product_id': product1.id, 'quantity': 3}, format='json')
        
        # 3. Fusionar carrito anónimo
        response3 = client.post('cart/merge-anonymous/', {'session_key': session_key}, format='json')
        
        # 4. Verificar que la cantidad se sumó: 3 + 2 = 5
        assert response3.status_code == status.HTTP_200_OK
        assert len(response3.data['items']) == 1
        assert response3.data['items'][0]['quantity'] == 5
        assert response3.data['total_items'] == 5

    def test_merge_anonymous_requires_authentication(self, setup_data):
        """Test: merge-anonymous requiere autenticación"""
        client = APIClient()
        
        response = client.post('cart/merge-anonymous/', {'session_key': 'abc123'}, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_cart_unique_together_constraint(self, setup_data):
        """Test: unique_together impide múltiples CartItem del mismo producto en el mismo carrito"""
        customer = setup_data['customer']
        product1 = setup_data['product1']
        
        cart = Cart.objects.create(user=customer)
        
        # Crear primer CartItem
        CartItem.objects.create(cart=cart, product=product1, quantity=1, price_snapshot=Decimal('100.00'))
        
        # Intentar crear segundo CartItem del mismo producto
        with pytest.raises(Exception):  # IntegrityError
            CartItem.objects.create(cart=cart, product=product1, quantity=2, price_snapshot=Decimal('100.00'))

    def test_cart_item_total_price_property(self, setup_data):
        """Test: CartItem.total_price calcula correctamente"""
        customer = setup_data['customer']
        product1 = setup_data['product1']
        
        cart = Cart.objects.create(user=customer)
        cart_item = CartItem.objects.create(
            cart=cart,
            product=product1,
            quantity=3,
            price_snapshot=Decimal('100.00')
        )
        
        assert cart_item.total_price == Decimal('300.00')

    def test_cart_total_items_property(self, setup_data):
        """Test: Cart.total_items suma correctamente"""
        customer = setup_data['customer']
        product1 = setup_data['product1']
        product2 = setup_data['product2']
        
        cart = Cart.objects.create(user=customer)
        CartItem.objects.create(cart=cart, product=product1, quantity=2, price_snapshot=Decimal('100.00'))
        CartItem.objects.create(cart=cart, product=product2, quantity=3, price_snapshot=Decimal('200.00'))
        
        assert cart.total_items == 5  # 2 + 3

    def test_cart_subtotal_property(self, setup_data):
        """Test: Cart.subtotal calcula correctamente"""
        customer = setup_data['customer']
        product1 = setup_data['product1']
        product2 = setup_data['product2']
        
        cart = Cart.objects.create(user=customer)
        CartItem.objects.create(cart=cart, product=product1, quantity=2, price_snapshot=Decimal('100.00'))
        CartItem.objects.create(cart=cart, product=product2, quantity=1, price_snapshot=Decimal('200.00'))
        
        # (100 * 2) + (200 * 1) = 400
        assert cart.subtotal == Decimal('400.00')
