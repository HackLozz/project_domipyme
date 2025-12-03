"""
Utilidades para crear notificaciones automáticamente en el sistema.
"""
from .models_notification import Notification


def create_notification(user, notification_type, title, message, **kwargs):
    """
    Crea una notificación para un usuario.
    
    Args:
        user: Usuario destinatario
        notification_type: Tipo de notificación (ej: 'order_created')
        title: Título de la notificación
        message: Mensaje de la notificación
        **kwargs: Campos adicionales (link_url, order_id, shop_id, product_id)
    
    Returns:
        Notification: La notificación creada
    """
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        link_url=kwargs.get('link_url'),
        order_id=kwargs.get('order_id'),
        shop_id=kwargs.get('shop_id'),
        product_id=kwargs.get('product_id'),
    )


def notify_order_created(order):
    """
    Crea notificación cuando se crea una nueva orden.
    Notifica al merchant de la tienda.
    """
    shop = order.items.first().product.shop if order.items.exists() else None
    if shop and shop.owner:
        create_notification(
            user=shop.owner,
            notification_type='order_created',
            title='Nueva Orden Recibida',
            message=f'Has recibido una nueva orden #{order.id} por ${order.total}.',
            link_url=f'/merchant/orders/{order.id}',
            order_id=order.id,
            shop_id=shop.id,
        )


def notify_order_status_changed(order, old_status, new_status):
    """
    Crea notificación cuando cambia el estado de una orden.
    Notifica al cliente.
    """
    status_messages = {
        'pending': 'está pendiente',
        'processing': 'está siendo procesada',
        'shipped': 'ha sido enviada',
        'delivered': 'ha sido entregada',
        'cancelled': 'ha sido cancelada',
    }
    
    message = f'Tu orden #{order.id} {status_messages.get(new_status, "ha cambiado de estado")}.'
    
    create_notification(
        user=order.customer,
        notification_type='order_status_changed',
        title=f'Orden #{order.id} - {new_status.title()}',
        message=message,
        link_url=f'/orders/{order.id}',
        order_id=order.id,
    )


def notify_low_stock(product, merchant):
    """
    Crea notificación cuando un producto tiene stock bajo.
    """
    create_notification(
        user=merchant,
        notification_type='low_stock',
        title='Stock Bajo',
        message=f'El producto "{product.name}" tiene solo {product.stock} unidades en stock.',
        link_url=f'/merchant/products/{product.id}',
        product_id=product.id,
        shop_id=product.shop.id,
    )


def notify_payment_received(transaction, merchant):
    """
    Crea notificación cuando se recibe un pago.
    """
    create_notification(
        user=merchant,
        notification_type='payment_received',
        title='Pago Recibido',
        message=f'Has recibido un pago de ${transaction.amount} (Orden #{transaction.order_id}).',
        link_url=f'/merchant/orders/{transaction.order_id}',
        order_id=transaction.order_id,
    )


def notify_shop_status_changed(shop, approved):
    """
    Crea notificación cuando cambia el estado de aprobación de una tienda.
    """
    if approved:
        notification_type = 'shop_approved'
        title = '¡Tienda Aprobada!'
        message = f'Tu tienda "{shop.name}" ha sido aprobada y ya está visible para los clientes.'
    else:
        notification_type = 'shop_rejected'
        title = 'Tienda Rechazada'
        message = f'Tu tienda "{shop.name}" no ha sido aprobada. Por favor contacta al administrador.'
    
    create_notification(
        user=shop.owner,
        notification_type=notification_type,
        title=title,
        message=message,
        link_url=f'/shops/{shop.slug}',
        shop_id=shop.id,
    )
