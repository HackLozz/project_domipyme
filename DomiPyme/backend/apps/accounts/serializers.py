# backend/apps/accounts/serializers.py
from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from django.core.exceptions import FieldDoesNotExist

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "is_staff", "date_joined")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    email = serializers.EmailField(required=True, validators=[UniqueValidator(queryset=User.objects.all(), message="Ese correo ya está registrado.")])

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name")

    def validate(self, data):
        pwd = data.get('password', '')
        email = data.get('email', '').lower()
        if email and pwd and email in pwd.lower():
            raise serializers.ValidationError("La contraseña no puede contener el correo.")
        return data

    def create(self, validated_data):
        # Usa create_user del manager (asegura hashing y señales)
        password = validated_data.pop("password")
        email = validated_data.pop("email")
        user = User.objects.create_user(email=email, password=password, **validated_data)
        return user


class CustomTokenObtainSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        request = self.context.get("request", None)

        if email and password:
            # Use authenticate with request for backends that need it
            user = authenticate(request=request, username=email, password=password)
            if not user:
                msg = _("No se pudo autenticar con las credenciales proporcionadas.")
                raise serializers.ValidationError(msg, code="authorization")
        else:
            msg = _("Se deben proporcionar 'email' y 'password'.")
            raise serializers.ValidationError(msg, code="authorization")

        attrs["user"] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


# ----- AdminUserSerializer seguro: solo incluye campos que existan en el modelo User -----
def _user_has_field(field_name):
    try:
        User._meta.get_field(field_name)
        return True
    except FieldDoesNotExist:
        return False


_admin_fields = ["id", "email", "first_name", "last_name", "is_staff"]
# añadir is_merchant solo si existe
if _user_has_field("is_merchant"):
    _admin_fields.append("is_merchant")
_admin_fields.append("date_joined")


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = tuple(_admin_fields)
