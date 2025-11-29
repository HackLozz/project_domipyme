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
    """
    class Meta:
        model = User
        fields = tuple(_base_user_fields)


class RegisterSerializer(serializers.ModelSerializer):
    """
    Registro que usa validate_password y UniqueValidator sobre email.
    Normaliza email (lowercase + strip) para evitar duplicados por mayúsculas.
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message=_("Ese correo ya está registrado."))]
    )

    class Meta:
        model = User
        # Si el modelo no tiene first_name/last_name, field list se adapta
        fields = ("email", "password") + tuple(
            f for f in ("first_name", "last_name", "full_name") if _user_has_field(f)
        )

    def validate(self, data):
        pwd = data.get('password', '')
        email = data.get('email', '').strip().lower()
        # Prevención: la contraseña no puede contener el correo
        if email and pwd and email in pwd.lower():
            raise serializers.ValidationError({"password": _("La contraseña no puede contener el correo.")})
        return data

    def create(self, validated_data):
        # Normalizar email y delegar en create_user del manager (hash + señales)
        password = validated_data.pop("password")
        email = validated_data.pop("email").strip().lower()
        # Aseguramos que se usa el manager create_user
        user = User.objects.create_user(email=email, password=password, **validated_data)
        return user


class CustomTokenObtainSerializer(serializers.Serializer):
    """
    Serializer usado para autenticar (login).
    Devuelve 'user' en validated_data para que la vista construya la respuesta.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        request = self.context.get("request", None)

        if not (email and password):
            msg = _("Se deben proporcionar 'email' y 'password'.")
            raise serializers.ValidationError({"detail": msg}, code="authorization")

        # Normalizar email antes de autenticar
        email_norm = email.strip().lower()
        # Django authenticate expects username arg for custom USERNAME_FIELD=email
        user = authenticate(request=request, username=email_norm, password=password)
        if not user:
            msg = _("No se pudo autenticar con las credenciales proporcionadas.")
            raise serializers.ValidationError({"detail": msg}, code="authorization")

        if not getattr(user, "is_active", True):
            msg = _("La cuenta está inactiva.")
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
