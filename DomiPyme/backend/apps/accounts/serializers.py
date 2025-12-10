# backend/apps/accounts/serializers.py
from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from django.core.exceptions import FieldDoesNotExist
from django.utils import timezone

User = get_user_model()


def _user_has_field(field_name):
    """
    Helper: comprueba si el modelo User tiene un campo dado.
    Evita errores si el modelo custom no define first_name / last_name etc.
    """
    try:
        User._meta.get_field(field_name)
        return True
    except FieldDoesNotExist:
        return False


# Construcción dinámica de campos para serializadores públicos/admin
_base_user_fields = ["id", "email"]
if _user_has_field("first_name") and _user_has_field("last_name"):
    _base_user_fields.extend(["first_name", "last_name"])
elif _user_has_field("full_name"):
    _base_user_fields.append("full_name")

if _user_has_field("is_staff"):
    _base_user_fields.append("is_staff")

if _user_has_field("is_merchant"):
    _base_user_fields.append("is_merchant")

if _user_has_field("date_joined"):
    _base_user_fields.append("date_joined")


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer público del usuario. Los campos se construyen dinámicamente
    para acomodar distintos User models (first_name/last_name o full_name).
    Incluye campo 'role' derivado para uso en frontend.
    """
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = tuple(_base_user_fields) + ("role",)
    
    def get_role(self, obj):
        """Retorna el rol basado en flags del usuario."""
        if obj.is_staff:
            return "admin"
        if obj.is_merchant:
            return "merchant"
        return "customer"


class RegisterSerializer(serializers.ModelSerializer):
    """
    Registro que usa validate_password y UniqueValidator sobre email.
    Normaliza email (lowercase + strip) para evitar duplicados por mayúsculas.
    Acepta role ('customer' o 'merchant') y phone.
    Sanitiza nombres y valida dominios de email prohibidos.
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message=_("Ese correo ya está registrado."))]
    )
    phone = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message=_("Ese teléfono ya está registrado."))]
    )
    role = serializers.ChoiceField(choices=['customer', 'merchant'], required=False, write_only=True)

    class Meta:
        model = User
        # Si el modelo no tiene first_name/last_name, field list se adapta
        fields = ("email", "password", "phone", "role") + tuple(
            f for f in ("first_name", "last_name", "full_name") if _user_has_field(f)
        )

    def validate(self, data):
        pwd = data.get('password', '')
        email = data.get('email', '').strip().lower()
        phone = data.get('phone', '').strip()
        first_name = data.get('first_name', '').strip() if 'first_name' in data else ''
        last_name = data.get('last_name', '').strip() if 'last_name' in data else ''
        
        # Validar dominio de email prohibido
        temp_domains = ['mailinator.com', 'tempmail', '10minutemail', 'guerrillamail']
        domain = email.split('@')[1] if '@' in email else ''
        if any(d in domain for d in temp_domains):
            raise serializers.ValidationError({"email": _("No se permiten emails temporales.")})
        
        # Prevención: la contraseña no puede contener el correo
        if email and pwd and email in pwd.lower():
            raise serializers.ValidationError({"password": _("La contraseña no puede contener el correo.")})
        
        # Validar fuerza de contraseña: mínimo 8 caracteres, mayúscula, minúscula y número
        if len(pwd) < 8 or not any(c.isupper() for c in pwd) or not any(c.islower() for c in pwd) or not any(c.isdigit() for c in pwd):
            raise serializers.ValidationError({"password": _("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.")})
        
        # Validar formato de teléfono si se proporciona
        if phone:
            if not phone.isdigit():
                raise serializers.ValidationError({"phone": _("El teléfono solo debe contener números.")})
            if len(phone) < 10 or len(phone) > 15:
                raise serializers.ValidationError({"phone": _("El teléfono debe tener entre 10 y 15 dígitos.")})
        
        # Validar nombres y apellidos (solo letras y espacios)
        import re
        name_regex = re.compile(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$')
        if first_name and not name_regex.match(first_name):
            raise serializers.ValidationError({"first_name": _("El nombre solo debe contener letras y espacios.")})
        if last_name and not name_regex.match(last_name):
            raise serializers.ValidationError({"last_name": _("El apellido solo debe contener letras y espacios.")})
        
        return data

    def create(self, validated_data):
        # Normalizar email y delegar en create_user del manager (hash + señales)
        password = validated_data.pop("password")
        email = validated_data.pop("email").strip().lower()
        role = validated_data.pop("role", "customer")
        phone = validated_data.pop("phone", None)
        
        # Convertir role a is_merchant
        is_merchant = (role == "merchant")
        
        # Aseguramos que se usa el manager create_user
        user = User.objects.create_user(
            email=email,
            password=password,
            phone=phone if phone else None,
            is_merchant=is_merchant,
            **validated_data
        )
        return user


class CustomTokenObtainSerializer(serializers.Serializer):
    """
    Serializer usado para autenticar (login).
    Devuelve 'user' en validated_data para que la vista construya la respuesta.
    Sanitiza email y password, valida formato, protege contra timing attacks.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password", "").strip()
        request = self.context.get("request", None)

        # Validar formato de email antes de autenticar
        import re
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_pattern, email):
            raise serializers.ValidationError({"detail": _("Formato de email inválido.")}, code="authorization")

        if not (email and password):
            msg = _("Se deben proporcionar 'email' y 'password'.")
            raise serializers.ValidationError({"detail": msg}, code="authorization")

        # Protege contra timing attacks: siempre llama authenticate
        user = authenticate(request=request, username=email, password=password)
        if not user:
            msg = _("No se pudo autenticar con las credenciales proporcionadas.")
            raise serializers.ValidationError({"detail": msg}, code="authorization")

        attrs["user"] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer para solicitar reset. No revela existencia del email en la respuesta;
    la vista debe responder siempre de forma genérica para evitar user-enumeration.
    """
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Confirmación de reset: recibe uidb64, token y new_password.
    Valida la contraseña usando validators de Django.
    """
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


# ----- AdminUserSerializer seguro: solo incluye campos que existan en el modelo User -----
_admin_fields = ["id", "email"]
if _user_has_field("first_name"):
    _admin_fields.append("first_name")
if _user_has_field("last_name"):
    _admin_fields.append("last_name")
if _user_has_field("full_name") and "full_name" not in _admin_fields:
    _admin_fields.append("full_name")
if _user_has_field("is_staff"):
    _admin_fields.append("is_staff")
if _user_has_field("is_merchant"):
    _admin_fields.append("is_merchant")
if _user_has_field("date_joined"):
    _admin_fields.append("date_joined")


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = tuple(_admin_fields)


# ===== Notification Serializer =====
from .models_notification import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer para notificaciones.
    """
    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'read',
            'link_url',
            'order_id',
            'shop_id',
            'product_id',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
