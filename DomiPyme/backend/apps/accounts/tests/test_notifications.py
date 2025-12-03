"""
Tests para el sistema de notificaciones.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.accounts.models_notification import Notification
from apps.accounts.notification_utils import create_notification

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email='user@test.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        email='other@test.com',
        password='testpass123',
        first_name='Other',
        last_name='User'
    )


@pytest.fixture
def notification(user):
    return Notification.objects.create(
        user=user,
        notification_type='general',
        title='Test Notification',
        message='This is a test notification.',
    )


@pytest.fixture
def unread_notifications(user):
    """Crea 3 notificaciones no leídas."""
    notifications = []
    for i in range(3):
        notifications.append(Notification.objects.create(
            user=user,
            notification_type='general',
            title=f'Notification {i+1}',
            message=f'Message {i+1}',
            read=False
        ))
    return notifications


@pytest.fixture
def read_notifications(user):
    """Crea 2 notificaciones leídas."""
    notifications = []
    for i in range(2):
        notifications.append(Notification.objects.create(
            user=user,
            notification_type='general',
            title=f'Read Notification {i+1}',
            message=f'Read Message {i+1}',
            read=True
        ))
    return notifications


# ===== Test Model =====
@pytest.mark.django_db
def test_notification_creation(user):
    """Test creating a notification."""
    notif = Notification.objects.create(
        user=user,
        notification_type='order_created',
        title='New Order',
        message='You have a new order',
        order_id=123,
    )
    assert notif.user == user
    assert notif.notification_type == 'order_created'
    assert notif.title == 'New Order'
    assert notif.read is False
    assert notif.order_id == 123


@pytest.mark.django_db
def test_notification_mark_as_read(notification):
    """Test marking notification as read."""
    assert notification.read is False
    notification.mark_as_read()
    assert notification.read is True


@pytest.mark.django_db
def test_notification_mark_as_unread(notification):
    """Test marking notification as unread."""
    notification.read = True
    notification.save()
    notification.mark_as_unread()
    assert notification.read is False


# ===== Test API - List =====
@pytest.mark.django_db
def test_list_notifications_authenticated(api_client, user, unread_notifications):
    """Authenticated user can list their notifications."""
    api_client.force_authenticate(user=user)
    response = api_client.get('/api/auth/notifications/')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data)
    assert len(results) == 3


@pytest.mark.django_db
def test_list_notifications_unauthenticated(api_client):
    """Unauthenticated user cannot list notifications."""
    response = api_client.get('/api/auth/notifications/')
    assert response.status_code == 401


@pytest.mark.django_db
def test_list_only_own_notifications(api_client, user, other_user, unread_notifications):
    """User only sees their own notifications."""
    # Create notification for other_user
    Notification.objects.create(
        user=other_user,
        notification_type='general',
        title='Other User Notification',
        message='This should not appear',
    )
    
    api_client.force_authenticate(user=user)
    response = api_client.get('/api/auth/notifications/')
    assert response.status_code == 200
    data = response.json()
    results = data.get('results', data)
    assert len(results) == 3  # Only user's notifications


# ===== Test API - Retrieve =====
@pytest.mark.django_db
def test_retrieve_notification(api_client, user, notification):
    """User can retrieve their own notification."""
    api_client.force_authenticate(user=user)
    response = api_client.get(f'/api/auth/notifications/{notification.id}/')
    assert response.status_code == 200
    data = response.json()
    assert data['id'] == notification.id
    assert data['title'] == notification.title


@pytest.mark.django_db
def test_retrieve_other_user_notification(api_client, user, other_user):
    """User cannot retrieve other user's notification."""
    other_notification = Notification.objects.create(
        user=other_user,
        notification_type='general',
        title='Other Notification',
        message='Should not access',
    )
    
    api_client.force_authenticate(user=user)
    response = api_client.get(f'/api/auth/notifications/{other_notification.id}/')
    assert response.status_code == 404


# ===== Test API - Mark as Read =====
@pytest.mark.django_db
def test_mark_notification_as_read(api_client, user, notification):
    """User can mark their notification as read."""
    api_client.force_authenticate(user=user)
    response = api_client.patch(f'/api/auth/notifications/{notification.id}/mark-as-read/')
    assert response.status_code == 200
    
    notification.refresh_from_db()
    assert notification.read is True


@pytest.mark.django_db
def test_mark_all_notifications_as_read(api_client, user, unread_notifications):
    """User can mark all notifications as read."""
    api_client.force_authenticate(user=user)
    response = api_client.patch('/api/auth/notifications/mark-all-as-read/')
    assert response.status_code == 200
    
    # Check all notifications are now read
    unread_count = Notification.objects.filter(user=user, read=False).count()
    assert unread_count == 0


# ===== Test API - Unread Count =====
@pytest.mark.django_db
def test_unread_count(api_client, user, unread_notifications, read_notifications):
    """Get unread notification count."""
    api_client.force_authenticate(user=user)
    response = api_client.get('/api/auth/notifications/unread-count/')
    assert response.status_code == 200
    data = response.json()
    assert data['unread_count'] == 3


@pytest.mark.django_db
def test_unread_count_zero(api_client, user):
    """Unread count is zero when no notifications."""
    api_client.force_authenticate(user=user)
    response = api_client.get('/api/auth/notifications/unread-count/')
    assert response.status_code == 200
    data = response.json()
    assert data['unread_count'] == 0


# ===== Test API - Recent =====
@pytest.mark.django_db
def test_recent_notifications(api_client, user):
    """Get recent notifications with default limit."""
    # Create 15 notifications
    for i in range(15):
        Notification.objects.create(
            user=user,
            notification_type='general',
            title=f'Notification {i}',
            message=f'Message {i}',
        )
    
    api_client.force_authenticate(user=user)
    response = api_client.get('/api/auth/notifications/recent/')
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10  # Default limit


@pytest.mark.django_db
def test_recent_notifications_custom_limit(api_client, user):
    """Get recent notifications with custom limit."""
    # Create 10 notifications
    for i in range(10):
        Notification.objects.create(
            user=user,
            notification_type='general',
            title=f'Notification {i}',
            message=f'Message {i}',
        )
    
    api_client.force_authenticate(user=user)
    response = api_client.get('/api/auth/notifications/recent/?limit=5')
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5


# ===== Test API - Delete =====
@pytest.mark.django_db
def test_delete_notification(api_client, user, notification):
    """User can delete their notification."""
    api_client.force_authenticate(user=user)
    response = api_client.delete(f'/api/auth/notifications/{notification.id}/')
    assert response.status_code == 204
    
    # Verify deletion
    assert not Notification.objects.filter(id=notification.id).exists()


@pytest.mark.django_db
def test_delete_other_user_notification(api_client, user, other_user):
    """User cannot delete other user's notification."""
    other_notification = Notification.objects.create(
        user=other_user,
        notification_type='general',
        title='Other Notification',
        message='Should not delete',
    )
    
    api_client.force_authenticate(user=user)
    response = api_client.delete(f'/api/auth/notifications/{other_notification.id}/')
    assert response.status_code == 404
    
    # Verify not deleted
    assert Notification.objects.filter(id=other_notification.id).exists()


# ===== Test API - Create (Should Fail) =====
@pytest.mark.django_db
def test_create_notification_via_api_forbidden(api_client, user):
    """Creating notifications via API should be forbidden."""
    api_client.force_authenticate(user=user)
    response = api_client.post('/api/auth/notifications/', {
        'notification_type': 'general',
        'title': 'Test',
        'message': 'Test message',
    })
    assert response.status_code == 403


# ===== Test Utility Functions =====
@pytest.mark.django_db
def test_create_notification_utility(user):
    """Test create_notification utility function."""
    notif = create_notification(
        user=user,
        notification_type='order_created',
        title='New Order',
        message='You have a new order',
        order_id=123,
        link_url='/orders/123',
    )
    
    assert notif.user == user
    assert notif.notification_type == 'order_created'
    assert notif.order_id == 123
    assert notif.link_url == '/orders/123'


@pytest.mark.django_db
def test_notification_ordering(user):
    """Test that notifications are ordered by created_at desc."""
    notif1 = Notification.objects.create(
        user=user, title='First', message='First', notification_type='general'
    )
    notif2 = Notification.objects.create(
        user=user, title='Second', message='Second', notification_type='general'
    )
    notif3 = Notification.objects.create(
        user=user, title='Third', message='Third', notification_type='general'
    )
    
    notifications = list(Notification.objects.filter(user=user))
    assert notifications[0].id == notif3.id  # Most recent first
    assert notifications[1].id == notif2.id
    assert notifications[2].id == notif1.id
