import pytest
from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from apps.accounts.serializers import RegisterSerializer

@pytest.mark.django_db
def test_registration_rejects_temp_email():
    data = {
        'email': 'user@mailinator.com',
        'password': 'P@ssw0rd!2025',
        'first_name': 'Juan',
        'last_name': 'Pérez',
    }
    serializer = RegisterSerializer(data=data)
    with pytest.raises(DRFValidationError) as exc:
        serializer.is_valid(raise_exception=True)
    assert 'No se permiten emails temporales.' in str(exc.value)

@pytest.mark.django_db
def test_registration_password_strength():
    data = {
        'email': 'user@example.com',
        'password': 'weak',
        'first_name': 'Juan',
        'last_name': 'Pérez',
    }
    serializer = RegisterSerializer(data=data)
    with pytest.raises(DRFValidationError) as exc:
        serializer.is_valid(raise_exception=True)
    assert 'caracteres' in str(exc.value) or 'contraseña' in str(exc.value)

@pytest.mark.django_db
def test_registration_name_sanitization():
    data = {
        'email': 'user@example.com',
        'password': 'P@ssw0rd!2025',
        'first_name': 'Juan123',
        'last_name': 'Pérez',
    }
    serializer = RegisterSerializer(data=data)
    with pytest.raises(DRFValidationError) as exc:
        serializer.is_valid(raise_exception=True)
    assert 'El nombre solo debe contener letras y espacios.' in str(exc.value)

@pytest.mark.django_db
def test_registration_valid_data():
    data = {
        'email': 'user@example.com',
        'password': 'P@ssw0rd!2025',
        'first_name': 'Juan',
        'last_name': 'Pérez',
    }
    serializer = RegisterSerializer(data=data)
    assert serializer.is_valid(), serializer.errors
