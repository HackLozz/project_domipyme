# backend/apps/accounts/views.py
import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.db import transaction

from rest_framework import generics, status, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    CustomTokenObtainSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    AdminUserSerializer,
)

logger = logging.getLogger(__name__)

User = get_user_model()
token_generator = PasswordResetTokenGenerator()


def _default_user_order_field():
    # Prioriza date_joined si existe, si no usa created_at o last_login como fallback
    valid_fields = {f.name for f in User._meta.get_fields()}
    for candidate in ('date_joined', 'created_at', 'last_login', 'id'):
        if candidate in valid_fields:
            return candidate
    return 'id'

class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAdminUser]
    ordering_field = _default_user_order_field()
    queryset = User.objects.all().order_by(f'-{ordering_field}')
    serializer_class = AdminUserSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ObtainTokenPairView(APIView):
    """
    Endpoint que devuelve access + refresh usando email + password.
    Se añade throttling para evitar brute-force y se devuelve payload 'user' para frontend.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]  # ajusta en settings si quieres otro rate

    def post(self, request, *args, **kwargs):
        serializer = CustomTokenObtainSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data.get("user")  # asumimos que el serializer retorna 'user'
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        response_data = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": getattr(user, "full_name", ""),
                "is_merchant": getattr(user, "is_merchant", False),
            }
        }
        logger.info("User logged in: %s (id=%s)", user.email, user.id)
        return Response(response_data, status=status.HTTP_200_OK)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(APIView):
    """
    POST { "email": "<email>" }
    Responde 200 siempre (evita user enumeration). Si existe el usuario se envía correo.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        logger.debug("Password reset requested for email: %s", email)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            logger.info("Password reset requested for non-existing email: %s", email)
            # No revelamos si existe o no
            return Response({"detail": "Si el correo existe, se enviaron instrucciones."},
                            status=status.HTTP_200_OK)

        # Build uid + token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        # Build frontend reset URL (frontend should handle route)
        frontend_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173")
        reset_url = f"{frontend_base}/reset-password/?uid={uid}&token={token}"

        # Render email HTML and prepare plain text fallback
        html_message = None
        plain_message = (
            f"Hola,\n\nPara restablecer tu contraseña, ingresa al siguiente enlace:\n\n{reset_url}\n\n"
            "Si no solicitaste esto, ignora este correo."
        )
        try:
            context = {"user": user, "reset_url": reset_url}
            html_message = render_to_string("accounts/password_reset_email.html", context)
        except Exception as e:
            logger.warning("Failed to render HTML email template: %s. Using plain text.", str(e))

        subject = "Restablecer contraseña - DomiPyme"
        try:
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
                html_message=html_message
            )
            logger.info("Password reset email sent to %s (uid=%s)", user.email, uid)
        except Exception as exc:
            # Log full exception; respond 200 to caller but record failure internally
            logger.exception("Failed to send password reset email to %s: %s", user.email, str(exc))
            # In production, puedes avisar a Sentry/monitoring aquí
            # Respond generically but indicate failure in logs for admins
            return Response({"detail": "No se pudo enviar el correo. Intente más tarde."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"detail": "Si el correo existe, se enviaron instrucciones."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """
    POST { "uidb64": "<uid>", "token": "<token>", "new_password": "<pwd>" }
    Valida token y actualiza la contraseña usando validate_password.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uidb64 = serializer.validated_data["uidb64"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception as exc:
            logger.warning("Password reset confirm failed: invalid uidb64 (%s). Error: %s", uidb64, str(exc))
            return Response({"detail": "Token inválido o usuario no encontrado."},
                            status=status.HTTP_400_BAD_REQUEST)

        if not token_generator.check_token(user, token):
            logger.info("Password reset token invalid/expired for user id=%s", getattr(user, "id", None))
            return Response({"detail": "Token inválido o expirado."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate password (Django validators)
        from django.contrib.auth.password_validation import validate_password
        try:
            validate_password(new_password, user=user)
        except Exception as exc:
            logger.info("Password validation failed for user id=%s: %s", user.id, str(exc))
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # Save password in atomic transaction
        try:
            with transaction.atomic():
                user.set_password(new_password)
                user.save()
        except Exception as exc:
            logger.exception("Failed to set new password for user id=%s: %s", user.id, str(exc))
            return Response({"detail": "Error al actualizar la contraseña."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        logger.info("Password updated successfully for user id=%s", user.id)
        return Response({"detail": "Contraseña cambiada correctamente."}, status=status.HTTP_200_OK)
