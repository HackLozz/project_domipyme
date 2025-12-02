import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_create_user_password_unusable_by_default():
    u = User.objects.create_user(email='test@example.com')
    assert u.email == 'test@example.com'
    assert u.has_usable_password() is False

@pytest.mark.django_db
def test_create_superuser_requires_password():
    with pytest.raises(ValueError):
        User.objects.create_superuser(email='admin@example.com', password=None)
    admin = User.objects.create_superuser(email='admin2@example.com', password='AdminPass123!')
    assert admin.is_staff and admin.is_superuser
    assert admin.has_usable_password() is True
