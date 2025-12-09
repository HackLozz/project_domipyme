# backend/apps/accounts/tests/test_reset_complete.py
"""
Test completo del flujo de reset password incluyendo confirmación.
"""
import pytest
import re
from django.urls import reverse
from django.core import mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()
token_generator = PasswordResetTokenGenerator()


@pytest.mark.django_db
@pytest.mark.django_db(transaction=True)
def test_password_reset_complete_flow():
    """
    Test completo del flujo de reset de contraseña:
    1. Solicitud de reset
    2. Verificación de email enviado
    3. Confirmación con nuevo password
    4. Login con nueva contraseña
    """
    from django.test.utils import override_settings
    
    # Deshabilitar throttling para tests
    with override_settings(REST_FRAMEWORK={'DEFAULT_THROTTLE_CLASSES': []}):
        client = APIClient()
    
        # 1. Crear usuario
        user = User.objects.create_user(email='resetme@example.com', password='OldPass123!')
        
        # 2. Solicitar reset
        url_request = reverse('accounts:password_reset_request')
        resp_request = client.post(url_request, {'email': 'resetme@example.com'}, format='json')
        
        assert resp_request.status_code == 200
        assert 'Si el correo existe' in resp_request.data['detail']
        assert len(mail.outbox) == 1
        
        # 3. Extraer uid y token del correo
        email_body = mail.outbox[0].body
        assert 'reset-password' in email_body
        
        # Extraer uid y token de la URL (formato: /reset-password/?uid=<uidb64>&token=<token>)
        match = re.search(r'uid=([^&]+)&token=([^&\s]+)', email_body)
        assert match, "No se encontró uid y token en el email"
        
        uid = match.group(1)
        token = match.group(2)
        
        # 4. Confirmar reset con nueva contraseña
        url_confirm = reverse('accounts:password_reset_confirm')
        new_password = 'NewSecurePass123!'
        resp_confirm = client.post(url_confirm, {
            'uidb64': uid,
            'token': token,
            'new_password': new_password
        }, format='json')
        
        assert resp_confirm.status_code == 200
        assert 'correctamente' in resp_confirm.data['detail'].lower()
        
        # 5. Verificar que la contraseña cambió: login con nueva contraseña debe funcionar
        url_login = reverse('accounts:token_obtain_pair')
        resp_login = client.post(url_login, {
            'email': 'resetme@example.com',
            'password': new_password
        }, format='json')
        
        assert resp_login.status_code == 200
        assert 'access' in resp_login.data
        
        # 6. Verificar que la vieja contraseña ya no funciona
        resp_old = client.post(url_login, {
            'email': 'resetme@example.com',
            'password': 'OldPass123!'
        }, format='json')
        
        assert resp_old.status_code == 400 or resp_old.status_code == 401


@pytest.mark.django_db
def test_password_reset_invalid_token():
    """Test que token inválido rechaza el reset."""
    client = APIClient()
    user = User.objects.create_user(email='test@example.com', password='Pass123!')
    
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    fake_token = 'fake-invalid-token-xyz'
    
    url_confirm = reverse('accounts:password_reset_confirm')
    resp = client.post(url_confirm, {
        'uidb64': uid,
        'token': fake_token,
        'new_password': 'NewPass123!'
    }, format='json')
    
    assert resp.status_code == 400
    assert 'inválido' in resp.data['detail'].lower() or 'expirado' in resp.data['detail'].lower()
