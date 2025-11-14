from django.urls import path
from .views import ShopListCreateView, ShopDetailView

urlpatterns = [
    path("", ShopListCreateView.as_view(), name="shops-list-create"),
    path("<slug:slug>/", ShopDetailView.as_view(), name="shops-detail"),
]
