import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.shops.models import Shop

User = get_user_model()

@pytest.mark.django_db
def test_create_shop_api():
    client = APIClient()
    user = User.objects.create_user(email="u@test.com", password="pass1234")
    client.force_authenticate(user=user)
    data = {"name":"Mi Tienda", "description":"Tienda prueba", "slug":"mi-tienda"}
    resp = client.post(reverse("shops-list-create"), data, format="json")
    assert resp.status_code == 201 or resp.status_code == 200
    assert Shop.objects.filter(name="Mi Tienda").exists()
