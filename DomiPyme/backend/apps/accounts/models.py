# backend/apps/accounts/models.py
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
)
from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.mail import send_mail


class CustomUserManager(BaseUserManager):
    """
    Gestor personalizado que usa 'email' como identificador único.
    """

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """
        Crea y guarda un usuario con el email y la contraseña proporcionados.
        NOTA: no forzamos password here para permitir casos especiales (ej: usuarios
        creados por OAuth), pero los superusuarios sí deben tener contraseña.
        """
        if not email:
            raise ValueError(_("El usuario debe tener un correo electrónico"))
        email = self.normalize_email(email)
        # normalizar a minúsculas para consistencia y trazabilidad
        email = email.lower()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            # Si no se establece password, guardamos sin password (inoperable para login).
            # Esto es intencional para soportar flujos especiales; documentar su uso.
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """
        Crear usuario regular. Por defecto is_active=True, is_staff=False, is_superuser=False.
        Se permite password=None para flujos especiales (OAuth), pero esto crea una cuenta
        sin password utilizable por login normal.
        """
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("is_active", True)
        # allow passing is_merchant via extra_fields (default False)
        extra_fields.setdefault("is_merchant", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Crear superusuario. Aquí sí exigimos contraseña por razones de seguridad.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_merchant", False)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("El superusuario debe tener is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("El superusuario debe tener is_superuser=True."))

        if not password:
            raise ValueError(_("El superusuario debe tener una contraseña válida."))

        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de usuario personalizado que utiliza 'email' como USERNAME_FIELD.
    Incluye campos de trazabilidad (created_at, updated_at) y utilidades para
    logs / envíos.
    """
    email = models.EmailField(_("email address"), unique=True, db_index=True)
    first_name = models.CharField(_("first name"), max_length=150, blank=True)
    last_name = models.CharField(_("last name"), max_length=150, blank=True)
    is_active = models.BooleanField(_("active"), default=True)
    is_staff = models.BooleanField(_("staff status"), default=False)
    # Nuevo campo para distinguir merchants (tiendas)
    is_merchant = models.BooleanField(_("merchant status"), default=False)

    # Trazabilidad temporal
    created_at = models.DateTimeField(_("created at"), default=timezone.now, editable=False)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # No pedir username ni otros campos obligatorios

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ("-created_at",)
        # email ya tiene unique=True, por lo que index existe, pero lo explicitamos para claridad
        indexes = [
            models.Index(fields=["email"], name="accounts_user_email_idx"),
        ]

    def __str__(self):
        # Garantiza representación válida aún antes de guardar (pk puede ser None)
        if self.email:
            return self.email
        if self.pk:
            return f"user-{self.pk}"
        return "user-unset"

    def get_full_name(self):
        """
        Retorna 'first_name last_name' si existe, sino el email.
        Útil para logging y notificaciones.
        """
        full = f"{self.first_name} {self.last_name}".strip()
        return full if full else self.email

    def get_short_name(self):
        """
        Retorna first_name si existe, sino el email (o parte del email).
        """
        if self.first_name:
            return self.first_name
        if self.email:
            return self.email.split("@")[0]
        return "user"

    def email_user(self, subject, message, from_email=None, **kwargs):
        """
        Enviar un email al usuario — envoltorio simple sobre django.core.mail.send_mail.
        """
        send_mail(subject, message, from_email or None, [self.email], **kwargs)

    @property
    def role(self):
        """Return role string based on user flags for frontend compatibility."""
        if self.is_superuser or self.is_staff:
            return 'admin'
        if self.is_merchant:
            return 'merchant'
        return 'customer'
