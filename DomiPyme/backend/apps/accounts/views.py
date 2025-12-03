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
from django.utils import timezone

from apps.shops.models import Shop, Product as ShopProduct
from apps.orders.models import Order
from apps.payments.models import Transaction

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

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

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


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        last_7_days = now - timezone.timedelta(days=7)

        users_total = User.objects.count()
        users_active = User.objects.filter(is_active=True).count()
        merchants_total = User.objects.filter(**{"is_merchant": True}).count() if hasattr(User, 'is_merchant') else 0

        shops_total = Shop.objects.count()
        shops_active = Shop.objects.filter(active=True).count()

        products_total = ShopProduct.objects.count()
        products_active = ShopProduct.objects.filter(active=True).count()

        orders_total = Order.objects.count()
        orders_paid = Order.objects.filter(status__in=["paid", "preparing", "dispatched", "delivered"]).count()
        orders_today = Order.objects.filter(created_at__gte=start_of_day).count()
        orders_last7 = Order.objects.filter(created_at__gte=last_7_days).count()

        tx_total = Transaction.objects.count()
        tx_approved = Transaction.objects.filter(status__iexact='approved').count()
        tx_today = Transaction.objects.filter(created_at__gte=start_of_day).count()

        # Revenue approximation based on approved transactions
        from django.db.models import Sum
        revenue_total = Transaction.objects.filter(status__iexact='approved').aggregate(s=Sum('amount')).get('s') or 0
        revenue_today = Transaction.objects.filter(status__iexact='approved', created_at__gte=start_of_day).aggregate(s=Sum('amount')).get('s') or 0

        data = {
            "users": {"total": users_total, "active": users_active, "merchants": merchants_total},
            "shops": {"total": shops_total, "active": shops_active},
            "products": {"total": products_total, "active": products_active},
            "orders": {"total": orders_total, "paid_or_later": orders_paid, "today": orders_today, "last7": orders_last7},
            "transactions": {"total": tx_total, "approved": tx_approved, "today": tx_today},
            "revenue": {"total": str(revenue_total), "today": str(revenue_today)},
            "generated_at": now.isoformat(),
        }
        return Response(data, status=status.HTTP_200_OK)


# ===== Notification ViewSet =====
from rest_framework.decorators import action
from .models_notification import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar notificaciones del usuario.
    - list: obtener todas las notificaciones del usuario autenticado
    - retrieve: obtener una notificación específica
    - mark_as_read: marcar una notificación como leída
    - mark_all_as_read: marcar todas como leídas
    - unread_count: obtener el contador de no leídas
    - delete: eliminar una notificación
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Solo devuelve notificaciones del usuario autenticado."""
        return Notification.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Deshabilitar creación manual vía API (se crean automáticamente por el sistema)."""
        return Response(
            {"detail": "No se pueden crear notificaciones manualmente."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    def update(self, request, *args, **kwargs):
        """Solo permitir actualización parcial del campo 'read'."""
        if 'read' not in request.data:
            return Response(
                {"detail": "Solo se puede actualizar el campo 'read'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().update(request, *args, **kwargs)
    
    @action(detail=True, methods=['patch'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        """
        PATCH /api/notifications/<id>/mark-as-read/
        Marca una notificación como leída.
        """
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['patch'], url_path='mark-all-as-read')
    def mark_all_as_read(self, request):
        """
        PATCH /api/notifications/mark-all-as-read/
        Marca todas las notificaciones del usuario como leídas.
        """
        updated = Notification.objects.filter(
            user=request.user,
            read=False
        ).update(read=True)
        
        return Response(
            {"detail": f"{updated} notificaciones marcadas como leídas."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """
        GET /api/notifications/unread-count/
        Obtiene el número de notificaciones no leídas.
        """
        count = Notification.objects.filter(
            user=request.user,
            read=False
        ).count()
        
        return Response(
            {"unread_count": count},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='recent')
    def recent(self, request):
        """
        GET /api/notifications/recent/?limit=10
        Obtiene las notificaciones recientes (por defecto las últimas 10).
        """
        limit = int(request.query_params.get('limit', 10))
        notifications = self.get_queryset()[:limit]
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
