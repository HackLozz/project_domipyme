# backend/apps/accounts/tests/test_auth.py
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.core import mail

User = get_user_model()

@pytest.mark.django_db
def test_register_and_login():
    client = APIClient()
    url = reverse('register')
    data = {
        'email':'testuser@example.com',
        'full_name':'Test User',
        'password':'StrongPass123!',
        'password2':'StrongPass123!'
    }
    resp = client.post(url, data, format='json')
    assert resp.status_code == 201
    # Login
    login_url = reverse('token_obtain_pair')
    resp2 = client.post(login_url, {'email':'testuser@example.com','password':'StrongPass123!'}, format='json')
    assert resp2.status_code == 200
    assert 'access' in resp2.data
    assert 'user' in resp2.data
    assert resp2.data['user']['email'] == 'testuser@example.com'

@pytest.mark.django_db
def test_password_reset_flow(monkeypatch):
    client = APIClient()
    user = User.objects.create_user(email='resetme@example.com', password='OldPass123!')
    # Request reset
    url = reverse('password_reset')
    resp = client.post(url, {'email':'resetme@example.com'}, format='json')
    assert resp.status_code == 200
    # check that an email was sent
    assert len(mail.outbox) == 1
    # Extract uid and token from email body (simple extraction)
    body = mail.outbox[0].body
    # we expect reset link present
    assert 'reset-password' in body

    # For a full confirm test you would parse uid & token - skipping heavy decode here
