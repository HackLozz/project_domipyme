# backend/apps/accounts/serializers.py
from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "is_staff", "date_joined")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name")

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        """
        Usar el manager create_user para mantener la lógica centralizada.
        """
        data = validated_data.copy()
        password = data.pop("password")
        email = data.pop("email", None)
        # data ahora contiene first_name/last_name u otros campos extras
        user = User.objects.create_user(email=email, password=password, **data)
        return user


class CustomTokenObtainSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        request = self.context.get("request", None)

        if email and password:
            # pasamos request para compatibilidad con backends que lo necesiten
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
