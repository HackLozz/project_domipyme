import pytest
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.core.exception_handler import custom_exception_handler
from rest_framework.exceptions import ValidationError, NotFound

class DummyView(APIView):
    def get(self, request):
        raise ValidationError({"field": "error"})
    def post(self, request):
        raise NotFound("Not found")

@pytest.mark.django_db
def test_custom_exception_handler_validation_error():
    factory = APIRequestFactory()
    request = factory.get("/dummy/")
    view = DummyView()
    exc = ValidationError({"field": "error"})
    context = {"request": request, "view": view}
    response = custom_exception_handler(exc, context)
    assert response.status_code == 400
    assert response.data["error_type"] == "ValidationError"
    assert "field" in response.data

@pytest.mark.django_db
def test_custom_exception_handler_not_found():
    factory = APIRequestFactory()
    request = factory.post("/dummy/")
    view = DummyView()
    exc = NotFound("Not found")
    context = {"request": request, "view": view}
    response = custom_exception_handler(exc, context)
    assert response.status_code == 404
    assert response.data["error_type"] == "NotFound"
    assert "detail" in response.data

@pytest.mark.django_db
def test_custom_exception_handler_unhandled():
    factory = APIRequestFactory()
    request = factory.get("/dummy/")
    view = DummyView()
    exc = RuntimeError("fail!")
    context = {"request": request, "view": view}
    response = custom_exception_handler(exc, context)
    assert response.status_code == 500
    assert response.data["error_type"] == "RuntimeError"
    assert "Error interno" in response.data["detail"]
