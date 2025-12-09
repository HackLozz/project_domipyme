# backend/apps/accounts/urls.py
from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    CheckEmailAvailabilityView,
    CheckPhoneAvailabilityView,
    ObtainTokenPairView,
    MeView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    AdminUserViewSet,
    AdminStatsView,
    NotificationViewSet,
)
from .views_email_verification import RequestEmailVerificationView, VerifyEmailCodeView

app_name = "accounts"

router = routers.DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('check-email/', CheckEmailAvailabilityView.as_view(), name='check_email'),
    path('check-phone/', CheckPhoneAvailabilityView.as_view(), name='check_phone'),
    path('token/', ObtainTokenPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('request-email-verification/', RequestEmailVerificationView.as_view(), name='request_email_verification'),
    path('verify-email-code/', VerifyEmailCodeView.as_view(), name='verify_email_code'),
]
