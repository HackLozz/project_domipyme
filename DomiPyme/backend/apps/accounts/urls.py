from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/token/", views.ObtainTokenPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", 
         # SimpleJWT built-in view for refresh
         __import__("rest_framework_simplejwt.views", fromlist=["TokenRefreshView"]).TokenRefreshView.as_view(),
         name="token_refresh"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("auth/password_reset/", views.PasswordResetRequestView.as_view(), name="password-reset"),
    path("auth/password_reset_confirm/", views.PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]
