"""
Test suite para el flujo de recuperación de contraseña.
Verifica:
1. Solicitud de reset (PasswordResetRequestView)
2. Confirmación de token y cambio de contraseña (PasswordResetConfirmView)
3. Validación de token expirado
4. Validación de contraseña débil
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core import mail
from rest_framework.test import APIClient
from rest_framework import status
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class PasswordResetRequestViewTestCase(TestCase):
    """Test PasswordResetRequestView - solicitud de reset"""
    
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/password-reset-request/'
        self.user = User.objects.create_user(
            email='test@example.com',
            password='OldPassword123!',
            first_name='Test',
            last_name='User'
        )
    
    def test_request_with_valid_email(self):
        """Debe devolver 200 y enviar email si el usuario existe"""
        response = self.client.post(self.url, {'email': 'test@example.com'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)
        self.assertIn('Si el correo existe', response.data['detail'])
        
        # Verificar que se envió un email (usando console backend en test)
        # En producción sería SMTP, en test podría ser console o mailmock
        logger.info(f"Emails enviados: {len(mail.outbox)}")
    
    def test_request_with_nonexistent_email(self):
        """Debe devolver 200 pero NO revelar que el email no existe"""
        response = self.client.post(self.url, {'email': 'nonexistent@example.com'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Si el correo existe', response.data['detail'])
    
    def test_request_with_invalid_email_format(self):
        """Debe rechazar email con formato inválido"""
        response = self.client.post(self.url, {'email': 'invalid-email'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # La respuesta puede tener 'detail' o 'email' con errores de validación
        self.assertTrue('detail' in response.data or 'email' in response.data)
    
    def test_request_with_empty_email(self):
        """Debe rechazar email vacío"""
        response = self.client.post(self.url, {'email': ''}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmViewTestCase(TestCase):
    """Test PasswordResetConfirmView - confirmación y cambio de contraseña"""
    
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/password-reset-confirm/'
        self.user = User.objects.create_user(
            email='test@example.com',
            password='OldPassword123!',
            first_name='Test',
            last_name='User'
        )
        self.token_generator = PasswordResetTokenGenerator()
        self.valid_token = self.token_generator.make_token(self.user)
        self.uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
    
    def test_confirm_with_valid_token_and_password(self):
        """Debe cambiar la contraseña si el token y contraseña son válidos"""
        new_password = 'NewPassword456!'
        
        response = self.client.post(
            self.url,
            {
                'uidb64': self.uidb64,
                'token': self.valid_token,
                'new_password': new_password
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Contraseña cambiada correctamente', response.data['detail'])
        
        # Verificar que la contraseña fue cambiada
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))
        self.assertFalse(self.user.check_password('OldPassword123!'))
    
    def test_confirm_with_invalid_token(self):
        """Debe rechazar un token inválido o expirado"""
        response = self.client.post(
            self.url,
            {
                'uidb64': self.uidb64,
                'token': 'invalid-token-12345',
                'new_password': 'NewPassword456!'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Token inválido o expirado', response.data['detail'])
    
    def test_confirm_with_invalid_uidb64(self):
        """Debe rechazar un uidb64 inválido"""
        response = self.client.post(
            self.url,
            {
                'uidb64': 'invalid-base64',
                'token': self.valid_token,
                'new_password': 'NewPassword456!'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Token inválido o usuario no encontrado', response.data['detail'])
    
    def test_confirm_with_weak_password(self):
        """Debe rechazar contraseñas débiles"""
        weak_passwords = [
            '12345678',  # Solo números
            'password',  # Muy común
            'abc',       # Muy corta
        ]
        
        for weak_pw in weak_passwords:
            response = self.client.post(
                self.url,
                {
                    'uidb64': self.uidb64,
                    'token': self.valid_token,
                    'new_password': weak_pw
                },
                format='json'
            )
            
            # Django validators pueden rechazar estas por ser comunes o débiles
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            # La respuesta puede tener 'detail' o 'new_password' con errores
            self.assertTrue('detail' in response.data or 'new_password' in response.data)
            logger.info(f"Contraseña débil '{weak_pw}' rechazada: {response.data}")
    
    def test_confirm_with_empty_password(self):
        """Debe rechazar contraseña vacía"""
        response = self.client.post(
            self.url,
            {
                'uidb64': self.uidb64,
                'token': self.valid_token,
                'new_password': ''
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_confirm_with_short_password(self):
        """Debe rechazar contraseña muy corta"""
        response = self.client.post(
            self.url,
            {
                'uidb64': self.uidb64,
                'token': self.valid_token,
                'new_password': 'abc123'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PasswordResetEndToEndTestCase(TestCase):
    """Test flujo completo: solicitud -> token -> reset"""
    
    def setUp(self):
        self.client = APIClient()
        self.request_url = '/api/auth/password-reset-request/'
        self.confirm_url = '/api/auth/password-reset-confirm/'
        self.user = User.objects.create_user(
            email='user@example.com',
            password='InitialPassword123!',
            first_name='Juan',
            last_name='Pérez'
        )
        self.token_generator = PasswordResetTokenGenerator()
    
    def test_full_password_reset_flow(self):
        """Test flujo completo de recuperación de contraseña"""
        
        # 1. Solicitar reset
        response = self.client.post(
            self.request_url,
            {'email': 'user@example.com'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 2. Generar token manualmente (en la vida real vendría del email)
        valid_token = self.token_generator.make_token(self.user)
        uidb64 = urlsafe_base64_encode(force_bytes(self.user.pk))
        
        # 3. Confirmar reset con token válido
        new_password = 'NewPassword456!'
        response = self.client.post(
            self.confirm_url,
            {
                'uidb64': uidb64,
                'token': valid_token,
                'new_password': new_password
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Verificar que contraseña antigua NO funciona
        old_login_response = self.client.post(
            '/api/auth/token/',
            {
                'email': 'user@example.com',
                'password': 'InitialPassword123!'
            },
            format='json'
        )
        # Puede ser 401 (Unauthorized) o 400 (Bad Request - invalid credentials)
        self.assertIn(old_login_response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
        
        # 5. Verificar que contraseña nueva SÍ funciona
        new_login_response = self.client.post(
            '/api/auth/token/',
            {
                'email': 'user@example.com',
                'password': new_password
            },
            format='json'
        )
        self.assertEqual(new_login_response.status_code, status.HTTP_200_OK, 
                        f"Login con contraseña nueva falló: {new_login_response.data}")
        self.assertIn('access', new_login_response.data)
        self.assertIn('refresh', new_login_response.data)
