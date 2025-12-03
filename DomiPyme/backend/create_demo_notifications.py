"""
Script para crear notificaciones de demostración.
Ejecutar: python manage.py shell < create_demo_notifications.py
"""
from django.contrib.auth import get_user_model
from apps.accounts.models_notification import Notification

User = get_user_model()

# Obtener usuarios
users = User.objects.all()[:3]

if not users.exists():
    print("No hay usuarios en el sistema. Crea algunos usuarios primero.")
    exit()

# Crear notificaciones de demostración para cada usuario
for user in users:
    # Notificación de orden creada
    Notification.objects.create(
        user=user,
        notification_type='order_created',
        title='Nueva Orden Recibida',
        message=f'Has recibido una nueva orden #12345 por $150.00.',
        link_url='/merchant/orders/12345',
        order_id=12345,
    )
    
    # Notificación de stock bajo
    Notification.objects.create(
        user=user,
        notification_type='low_stock',
        title='Stock Bajo',
        message='El producto "iPhone 13" tiene solo 3 unidades en stock.',
        link_url='/merchant/products/1',
        product_id=1,
    )
    
    # Notificación de pago recibido
    Notification.objects.create(
        user=user,
        notification_type='payment_received',
        title='Pago Recibido',
        message='Has recibido un pago de $299.99 (Orden #12346).',
        link_url='/merchant/orders/12346',
        order_id=12346,
    )
    
    # Notificación general
    Notification.objects.create(
        user=user,
        notification_type='general',
        title='Bienvenido a DomiPyme',
        message='¡Gracias por unirte a nuestra plataforma! Comienza explorando las funcionalidades.',
        read=True,  # Esta ya leída
    )
    
    # Notificación de cambio de estado de orden
    Notification.objects.create(
        user=user,
        notification_type='order_status_changed',
        title='Orden #12347 - Enviada',
        message='Tu orden #12347 ha sido enviada y está en camino.',
        link_url='/orders/12347',
        order_id=12347,
    )

print(f"✓ Creadas notificaciones de demostración para {users.count()} usuarios.")
