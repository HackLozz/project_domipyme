"""
DomiPyme - Accounts Views
Maneja autenticación, registro, gestión de usuarios y recuperación de contraseña.

Features:
- Registro de usuarios con validación de email y teléfono
- Autenticación JWT con tokens de acceso y refresh
- Sistema de recuperación de contraseña con emails HTML
- Panel de administración con estadísticas
- Gestión de notificaciones de usuario
"""

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
from rest_framework.throttling import AnonRateThrottle
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
    """
    Determina el campo de ordenamiento por defecto para usuarios.
    
    Returns:
        str: Nombre del campo a usar para ordenamiento (date_joined, created_at, last_login o id)
    """
    valid_fields = {f.name for f in User._meta.get_fields()}
    for candidate in ('date_joined', 'created_at', 'last_login', 'id'):
        if candidate in valid_fields:
            return candidate
    return 'id'

class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para administradores.
    
    Permite a los administradores ver la lista de usuarios del sistema
    y obtener detalles de usuarios individuales.
    
    Permissions:
        - IsAdminUser: Solo usuarios con is_staff=True
    """
    permission_classes = [IsAdminUser]
    ordering_field = _default_user_order_field()
    queryset = User.objects.all().order_by(f'-{ordering_field}')
    serializer_class = AdminUserSerializer


class RegisterView(generics.CreateAPIView):
    """
    API endpoint para registro de nuevos usuarios.
    
    POST /api/v1/auth/register/
    Body: { "email", "password", "first_name", "last_name", "phone", "is_merchant" }
    
    Returns:
        201: Usuario creado exitosamente
        400: Error de validación
    """
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save(is_active=False)
        # Generar y enviar código de verificación
        from .email_verification import generate_code, send_verification_email
        from .models_email_verification import EmailVerification
        code = generate_code()
        EmailVerification.objects.create(user=user, code=code)
        send_verification_email(user, code)


class CheckEmailAvailabilityView(APIView):
    """
    Verifica si un email está disponible para registro.
    
    POST /api/v1/auth/check-email/
    Body: { "email": "test@example.com" }
    
    Returns:
        200: { "available": true/false, "message": "..." }
        400: Error de validación
    
    Note:
        Incluye throttling para prevenir enumeración masiva de usuarios.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response(
                {"available": False, "message": "El email es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar formato básico
        import re
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, email):
            return Response(
                {"available": False, "message": "Formato de email inválido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si existe
        exists = User.objects.filter(email__iexact=email).exists()
        
        if exists:
            return Response(
                {"available": False, "message": "Este email ya está registrado"},
                status=status.HTTP_200_OK
            )
        
        return Response(
            {"available": True, "message": "Email disponible"},
            status=status.HTTP_200_OK
        )


class CheckPhoneAvailabilityView(APIView):
    """
    Verifica si un número de teléfono está disponible para registro.
    
    POST /api/v1/auth/check-phone/
    Body: { "phone": "3001234567" }
    
    Returns:
        200: { "available": true/false, "message": "..." }
        400: Error de validación (formato inválido, longitud incorrecta)
    
    Validations:
        - Solo dígitos numéricos
        - Longitud entre 10 y 15 caracteres
        - Unicidad en la base de datos
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        
        if not phone:
            return Response(
                {"available": False, "message": "El teléfono es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que solo contenga dígitos
        if not phone.isdigit():
            return Response(
                {"available": False, "message": "El teléfono solo debe contener números"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar longitud (10-15 dígitos)
        if len(phone) < 10 or len(phone) > 15:
            return Response(
                {"available": False, "message": "El teléfono debe tener entre 10 y 15 dígitos"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si existe (asumiendo que User tiene campo phone)
        exists = User.objects.filter(phone=phone).exists()
        
        if exists:
            return Response(
                {"available": False, "message": "Este teléfono ya está registrado"},
                status=status.HTTP_200_OK
            )
        
        return Response(
            {"available": True, "message": "Teléfono disponible"},
            status=status.HTTP_200_OK
        )


class ObtainTokenPairView(APIView):
    """
    Autentica usuarios y devuelve tokens JWT.
    
    POST /api/v1/auth/token/
    Body: { "email": "user@example.com", "password": "..." }
    
    Returns:
        200: {
            "access": "eyJ...",
            "refresh": "eyJ...",
            "user": {
                "id": 1,
                "email": "user@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "is_merchant": false,
                "is_staff": false,
                "role": "customer"
            }
        }
        400: Credenciales inválidas
        429: Demasiados intentos (throttling)
    
    Security:
        - Throttling habilitado para prevenir ataques de fuerza bruta
        - Los logs registran intentos de autenticación
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = CustomTokenObtainSerializer(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data.get("user")
            refresh = RefreshToken.for_user(user)
            response_data = {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": getattr(user, "first_name", ""),
                    "last_name": getattr(user, "last_name", ""),
                    "is_merchant": getattr(user, "is_merchant", False),
                    "is_staff": getattr(user, "is_staff", False),
                    "role": "admin" if user.is_staff else ("merchant" if getattr(user, "is_merchant", False) else "customer"),
                    "is_verified": getattr(user, "is_active", False),
                }
            }
            logger.info("User logged in: %s (id=%s) IP=%s UA=%s", user.email, user.id, request.META.get('REMOTE_ADDR'), request.META.get('HTTP_USER_AGENT'))
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as exc:
            # Loguear intento fallido con IP y user-agent
            logger.warning("Login failed for email=%s IP=%s UA=%s: %s", request.data.get('email', ''), request.META.get('REMOTE_ADDR'), request.META.get('HTTP_USER_AGENT'), str(exc))
            raise


class MeView(generics.RetrieveAPIView):
    """
    Obtiene y actualiza los datos del usuario autenticado.
    
    GET /api/v1/auth/me/
    Returns: Datos del usuario actual
    
    PUT /api/v1/auth/me/
    Body: { "first_name": "...", "last_name": "...", ... }
    Returns: Datos actualizados del usuario
    
    Permissions:
        - IsAuthenticated: Solo usuarios autenticados
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtiene los datos del usuario autenticado."""
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        """Actualiza parcialmente los datos del usuario autenticado."""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """
    Solicita un enlace de restablecimiento de contraseña.
    
    POST /api/v1/auth/password-reset-request/
    Body: { "email": "user@example.com" }
    
    Returns:
        200: { "detail": "Si el correo existe, se enviaron instrucciones." }
        
    Security:
        - Responde 200 siempre para evitar enumeración de usuarios
        - Si el usuario existe, envía un email con token único válido por 1 hora
        - El token solo puede usarse una vez
        - Incluye throttling para prevenir spam
    
    Email Template:
        - HTML responsive con botón de acción
        - Fallback a texto plano si el template falla
        - Incluye información de expiración y seguridad
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
            "Si no solicitaste esto, ignora este correo.\n\nSaludos,\nEquipo DomiPyme"
        )
        try:
            context = {
                "user": user,
                "reset_url": reset_url,
                "frontend_base": frontend_base
            }
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
