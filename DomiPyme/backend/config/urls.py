# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth / accounts
    path('api/auth/', include('apps.accounts.urls')),

    # Apps principales
    path('api/', include('apps.products.urls')),
    path('api/', include('apps.orders.urls')),
    path('api/', include('apps.payments.urls')),
    path('api/', include('apps.shops.urls')),

    # Si tienes otras rutas o routers, añádelas aquí
]
