"""
Modelo de Notificaciones para el sistema DomiPyme.
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Notification(models.Model):
    """
    Modelo para notificaciones del sistema.
    Tipos: order_created, order_status_changed, low_stock, new_review, etc.
    """
    
    NOTIFICATION_TYPES = [
        ('order_created', 'Nueva Orden'),
        ('order_status_changed', 'Estado de Orden Cambiado'),
        ('low_stock', 'Stock Bajo'),
        ('new_review', 'Nueva Reseña'),
        ('payment_received', 'Pago Recibido'),
        ('shop_approved', 'Tienda Aprobada'),
        ('shop_rejected', 'Tienda Rechazada'),
        ('general', 'General'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Usuario'
    )
    
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPES,
        default='general',
        verbose_name='Tipo de Notificación'
    )
    
    title = models.CharField(
        max_length=200,
        verbose_name='Título'
    )
    
    message = models.TextField(
        verbose_name='Mensaje'
    )
    
    read = models.BooleanField(
        default=False,
        verbose_name='Leída'
    )
    
    # Campos opcionales para enlaces
    link_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='URL de Enlace',
        help_text='URL relativa dentro de la app (ej: /orders/123)'
    )
    
    # Referencias opcionales a objetos relacionados
    order_id = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='ID de Orden'
    )
    
    shop_id = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='ID de Tienda'
    )
    
    product_id = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='ID de Producto'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'read']),
        ]
    
    def __str__(self):
        status = "✓" if self.read else "●"
        return f"{status} {self.title} - {self.user.email}"
    
    def mark_as_read(self):
        """Marca la notificación como leída."""
        if not self.read:
            self.read = True
            self.save(update_fields=['read'])
    
    def mark_as_unread(self):
        """Marca la notificación como no leída."""
        if self.read:
            self.read = False
            self.save(update_fields=['read'])
