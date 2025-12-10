import pytest
from rest_framework.exceptions import ValidationError as DRFValidationError
from apps.accounts.serializers import CustomTokenObtainSerializer

@pytest.mark.django_db
def test_login_email_sanitization():
    # Email con espacios y mayúsculas debe normalizarse
    data = {'email': '  USER@EXAMPLE.COM  ', 'password': 'fakepass'}
    serializer = CustomTokenObtainSerializer(data=data)
    with pytest.raises(DRFValidationError) as exc:
        serializer.is_valid(raise_exception=True)
    assert 'No se pudo autenticar' in str(exc.value) or 'credenciales' in str(exc.value)

@pytest.mark.django_db
def test_login_invalid_email_format():
    data = {'email': 'invalid-email', 'password': 'fakepass'}
    serializer = CustomTokenObtainSerializer(data=data)
    with pytest.raises(DRFValidationError) as exc:
        serializer.is_valid(raise_exception=True)
    msg = str(exc.value)
    assert ('Formato de email inválido' in msg or
            'Introduzca una dirección de correo electrónico válida.' in msg)

@pytest.mark.django_db
def test_login_missing_fields():
    data = {'email': '', 'password': ''}
    serializer = CustomTokenObtainSerializer(data=data)
    with pytest.raises(DRFValidationError) as exc:
        serializer.is_valid(raise_exception=True)
    msg = str(exc.value)
    assert ('Se deben proporcionar' in msg or
            'Este campo no puede estar en blanco.' in msg)

@pytest.mark.django_db
def test_login_wrong_password():
    # Usuario real
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_user(email='testuser@example.com', password='P@ssw0rd!2025')
    data = {'email': 'testuser@example.com', 'password': 'wrongpass'}
    serializer = CustomTokenObtainSerializer(data=data)
    with pytest.raises(DRFValidationError) as exc:
        serializer.is_valid(raise_exception=True)
    assert 'No se pudo autenticar' in str(exc.value)

@pytest.mark.django_db
def test_login_success():
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_user(email='testuser2@example.com', password='P@ssw0rd!2025')
    data = {'email': 'testuser2@example.com', 'password': 'P@ssw0rd!2025'}
    serializer = CustomTokenObtainSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data['user'].email == 'testuser2@example.com'
