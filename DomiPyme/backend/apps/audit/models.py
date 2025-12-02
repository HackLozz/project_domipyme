"""
Modelo para audit logging de acciones críticas.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class AuditLog(models.Model):
    """
    Registra acciones importantes del sistema para auditoría.
    """
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('password_reset', 'Password Reset'),
        ('permission_denied', 'Permission Denied'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    changes = models.JSONField(null=True, blank=True)  # Cambios realizados
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp', 'user']),
            models.Index(fields=['model_name', 'object_id']),
        ]
    
    def __str__(self):
        user_str = self.user.email if self.user else 'Anonymous'
        return f"{user_str} - {self.action} - {self.model_name} ({self.timestamp})"


def log_action(user, action, model_name='', object_id=None, object_repr='', changes=None, request=None):
    """
    Utility function para crear audit logs.
    
    Args:
        user: User instance o None
        action: str - tipo de acción (ver ACTION_CHOICES)
        model_name: str - nombre del modelo afectado
        object_id: int - ID del objeto afectado
        object_repr: str - representación string del objeto
        changes: dict - cambios realizados (before/after)
        request: HttpRequest - request para extraer IP y user agent
    """
    ip_address = None
    user_agent = ''
    
    if request:
        # Obtener IP real considerando proxies
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
    
    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=object_id,
        object_repr=object_repr,
        changes=changes,
        ip_address=ip_address,
        user_agent=user_agent
    )
