# backend/apps/orders/tests/test_payments.py
import pytest
from decimal import Decimal
from unittest.mock import patch, MagicMock
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.orders.models import Order, OrderItem, Payment
from apps.shops.models import Shop, Product

User = get_user_model()


@pytest.mark.django_db
class TestPaymentIntegration:
    """Tests para el sistema de pagos con Stripe"""

    @pytest.fixture
    def setup_data(self):
        """Fixture para crear datos de prueba"""
        # Usuario
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
        
        # Producto
        product = Product.objects.create(
            shop=shop,
            name='Product 1',
            description='Test product',
            price=Decimal('100.00'),
            stock=10,
            active=True
        )
        
        # Orden
        order = Order.objects.create(
            customer=customer,
            shop=shop,
            total=Decimal('100.00'),
            status='pending',
            payment_confirmed=False
        )
        
        OrderItem.objects.create(
            order=order,
            product=product,
            price=Decimal('100.00'),
            quantity=1
        )
        
        return {
            'customer': customer,
            'merchant': merchant,
            'shop': shop,
            'product': product,
            'order': order,
        }

    def test_payment_model_creation(self, setup_data):
        """Test: Crear Payment correctamente"""
        order = setup_data['order']
        
        payment = Payment.objects.create(
            order=order,
            amount=Decimal('100.00'),
            currency='usd',
            payment_method='stripe',
            status='pending'
        )
        
        assert payment.order == order
        assert payment.amount == Decimal('100.00')
        assert payment.status == 'pending'
        assert payment.payment_method == 'stripe'

    def test_payment_mark_as_succeeded(self, setup_data):
        """Test: mark_as_succeeded actualiza orden y decrementa stock"""
        order = setup_data['order']
        product = setup_data['product']
        initial_stock = product.stock
        
        payment = Payment.objects.create(
            order=order,
            amount=Decimal('100.00'),
            currency='usd',
            payment_method='stripe',
            status='pending'
        )
        
        payment.mark_as_succeeded()
        
        # Verificar payment
        payment.refresh_from_db()
        assert payment.status == 'succeeded'
        assert payment.paid_at is not None
        
        # Verificar orden
        order.refresh_from_db()
        assert order.payment_confirmed is True
        assert order.status == 'paid'
        
        # Verificar stock decrementado
        product.refresh_from_db()
        assert product.stock == initial_stock - 1

    def test_payment_mark_as_failed(self, setup_data):
        """Test: mark_as_failed cancela la orden"""
        order = setup_data['order']
        
        payment = Payment.objects.create(
            order=order,
            amount=Decimal('100.00'),
            currency='usd',
            payment_method='stripe',
            status='pending'
        )
        
        payment.mark_as_failed()
        
        # Verificar payment
        payment.refresh_from_db()
        assert payment.status == 'failed'
        
        # Verificar orden
        order.refresh_from_db()
        assert order.status == 'cancelled'

    @patch('stripe.PaymentIntent.create')
    def test_create_payment_intent_success(self, mock_stripe_create, setup_data):
        """Test: Crear PaymentIntent exitosamente"""
        client = APIClient()
        customer = setup_data['customer']
        order = setup_data['order']
        client.force_authenticate(user=customer)
        
        # Mock de Stripe
        mock_stripe_create.return_value = MagicMock(
            id='pi_test123',
            client_secret='pi_test123_secret_test',
            status='requires_payment_method'
        )
        
        data = {'order_id': order.id}
        response = client.post('/api/payments/create-intent/', data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'client_secret' in response.data
        assert 'payment_intent_id' in response.data
        assert str(response.data['amount']) == '100.00'
        
        # Verificar que se creó Payment
        payment = Payment.objects.get(order=order)
        assert payment.stripe_payment_intent_id == 'pi_test123'
        assert payment.stripe_client_secret == 'pi_test123_secret_test'
        assert payment.status == 'processing'

    def test_create_payment_intent_missing_order_id(self, setup_data):
        """Test: Error si falta order_id"""
        client = APIClient()
        customer = setup_data['customer']
        client.force_authenticate(user=customer)
        
        response = client.post('/api/payments/create-intent/', {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'order_id' in str(response.data['detail']).lower()

    def test_create_payment_intent_order_not_found(self, setup_data):
        """Test: Error si orden no existe"""
        client = APIClient()
        customer = setup_data['customer']
        client.force_authenticate(user=customer)
        
        data = {'order_id': 99999}
        response = client.post('/api/payments/create-intent/', data, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_payment_intent_order_already_paid(self, setup_data):
        """Test: Error si orden ya fue pagada"""
        client = APIClient()
        customer = setup_data['customer']
        order = setup_data['order']
        client.force_authenticate(user=customer)
        
        # Crear payment ya exitoso
        Payment.objects.create(
            order=order,
            amount=Decimal('100.00'),
            currency='usd',
            payment_method='stripe',
            status='succeeded'
        )
        
        data = {'order_id': order.id}
        response = client.post('/api/payments/create-intent/', data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'ya fue pagada' in str(response.data['detail']).lower()

    def test_create_payment_intent_unauthenticated(self, setup_data):
        """Test: Usuario no autenticado no puede crear PaymentIntent"""
        client = APIClient()
        order = setup_data['order']
        
        data = {'order_id': order.id}
        response = client.post('/api/payments/create-intent/', data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @patch('stripe.PaymentIntent.retrieve')
    def test_create_payment_intent_existing(self, mock_stripe_retrieve, setup_data):
        """Test: Retornar PaymentIntent existente si ya existe"""
        client = APIClient()
        customer = setup_data['customer']
        order = setup_data['order']
        client.force_authenticate(user=customer)
        
        # Crear payment existente
        Payment.objects.create(
            order=order,
            amount=Decimal('100.00'),
            currency='usd',
            payment_method='stripe',
            status='processing',
            stripe_payment_intent_id='pi_existing123',
            stripe_client_secret='pi_existing123_secret'
        )
        
        # Mock de Stripe retrieve
        mock_stripe_retrieve.return_value = MagicMock(
            id='pi_existing123',
            client_secret='pi_existing123_secret',
            status='requires_payment_method'
        )
        
        data = {'order_id': order.id}
        response = client.post('/api/payments/create-intent/', data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['payment_intent_id'] == 'pi_existing123'

    def test_webhook_payment_success_handler(self, setup_data):
        """Test: Webhook procesa pago exitoso correctamente"""
        order = setup_data['order']
        product = setup_data['product']
        initial_stock = product.stock
        
        # Crear payment
        payment = Payment.objects.create(
            order=order,
            amount=Decimal('100.00'),
            currency='usd',
            payment_method='stripe',
            status='processing',
            stripe_payment_intent_id='pi_webhook123'
        )
        
        # Importar función
        from apps.orders.views import handle_payment_success
        
        # Simular evento de webhook
        payment_intent = {
            'id': 'pi_webhook123',
            'amount': 10000,
            'status': 'succeeded'
        }
        
        handle_payment_success(payment_intent)
        
        # Verificar resultados
        payment.refresh_from_db()
        assert payment.status == 'succeeded'
        assert payment.paid_at is not None
        
        order.refresh_from_db()
        assert order.payment_confirmed is True
        assert order.status == 'paid'
        
        product.refresh_from_db()
        assert product.stock == initial_stock - 1

    def test_webhook_payment_failure_handler(self, setup_data):
        """Test: Webhook procesa pago fallido correctamente"""
        order = setup_data['order']
        
        # Crear payment
        payment = Payment.objects.create(
            order=order,
            amount=Decimal('100.00'),
            currency='usd',
            payment_method='stripe',
            status='processing',
            stripe_payment_intent_id='pi_fail123'
        )
        
        # Importar función
        from apps.orders.views import handle_payment_failure
        
        # Simular evento de webhook
        payment_intent = {
            'id': 'pi_fail123',
            'amount': 10000,
            'status': 'failed'
        }
        
        handle_payment_failure(payment_intent)
        
        # Verificar resultados
        payment.refresh_from_db()
        assert payment.status == 'failed'
        
        order.refresh_from_db()
        assert order.status == 'cancelled'

    def test_payment_viewset_list_authenticated(self, setup_data):
        """Test: Usuario autenticado puede ver sus pagos"""
        client = APIClient()
        customer = setup_data['customer']
        order = setup_data['order']
        client.force_authenticate(user=customer)
        
        # Crear payment
        Payment.objects.create(
            order=order,
            amount=Decimal('100.00'),
            currency='usd',
            payment_method='stripe',
            status='succeeded'
        )
        
        response = client.get('/api/payment-history/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['amount'] == '100.00'

    def test_payment_viewset_list_unauthenticated(self, setup_data):
        """Test: Usuario no autenticado no puede ver pagos"""
        client = APIClient()
        
        response = client.get('/api/payment-history/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_payment_viewset_only_own_payments(self, setup_data):
        """Test: Usuario solo ve sus propios pagos"""
        client = APIClient()
        customer = setup_data['customer']
        order = setup_data['order']
        
        # Crear otro usuario y orden
        other_user = User.objects.create_user(
            email='other@test.com',
            password='pass123',
            is_merchant=False
        )
        other_order = Order.objects.create(
            customer=other_user,
            shop=setup_data['shop'],
            total=Decimal('50.00'),
            status='pending'
        )
        
        # Crear payments
        Payment.objects.create(
            order=order,
            amount=Decimal('100.00'),
            currency='usd',
            status='succeeded'
        )
        Payment.objects.create(
            order=other_order,
            amount=Decimal('50.00'),
            currency='usd',
            status='succeeded'
        )
        
        # Verificar que solo ve su pago
        client.force_authenticate(user=customer)
        response = client.get('/api/payment-history/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['amount'] == '100.00'

    def test_payment_one_to_one_with_order(self, setup_data):
        """Test: OneToOne relationship - solo un Payment por Order"""
        order = setup_data['order']
        
        # Crear primer payment
        Payment.objects.create(
            order=order,
            amount=Decimal('100.00'),
            currency='usd',
            status='pending'
        )
        
        # Intentar crear segundo payment para la misma orden
        with pytest.raises(Exception):  # IntegrityError
            Payment.objects.create(
                order=order,
                amount=Decimal('100.00'),
                currency='usd',
                status='pending'
            )
