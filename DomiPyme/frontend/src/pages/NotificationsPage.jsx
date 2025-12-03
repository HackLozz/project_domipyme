import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../components/Api';
import { useAuth } from '../context/AuthProvider';
import { showToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [isAuthenticated, navigate]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/notifications/');
      const data = response.data.results || response.data;
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/auth/notifications/${id}/mark-as-read/`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
      showToast('Error al marcar como leída', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/auth/notifications/mark-all-as-read/');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('Todas las notificaciones marcadas como leídas', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast('Error al marcar todas como leídas', 'error');
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await api.delete(`/auth/notifications/${deleteConfirm.id}/`);
      setNotifications(prev => prev.filter(n => n.id !== deleteConfirm.id));
      showToast('Notificación eliminada', 'success');
      setDeleteConfirm({ open: false, id: null });
    } catch (error) {
      console.error('Error deleting notification:', error);
      showToast('Error al eliminar notificación', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link_url) {
      navigate(notification.link_url);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      order_created: '🛒',
      order_status_changed: '📦',
      low_stock: '⚠️',
      new_review: '⭐',
      payment_received: '💰',
      shop_approved: '✅',
      shop_rejected: '❌',
      general: '📢',
    };
    return icons[type] || '🔔';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div style={styles.container}>
        <LoadingSpinner fullScreen={true} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={handleDeleteConfirm}
        title="Eliminar notificación"
        message="¿Estás seguro de que deseas eliminar esta notificación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />

      <div style={styles.header}>
        <h1 style={styles.title}>Notificaciones</h1>
        {unreadCount > 0 && (
          <Button variant="primary" size="small" onClick={handleMarkAllAsRead}>
            Marcar todas como leídas ({unreadCount})
          </Button>
        )}
      </div>

      <div style={styles.filters}>
        <button
          style={{
            ...styles.filterButton,
            ...(filter === 'all' ? styles.filterButtonActive : {}),
          }}
          onClick={() => setFilter('all')}
        >
          Todas ({notifications.length})
        </button>
        <button
          style={{
            ...styles.filterButton,
            ...(filter === 'unread' ? styles.filterButtonActive : {}),
          }}
          onClick={() => setFilter('unread')}
        >
          No leídas ({unreadCount})
        </button>
        <button
          style={{
            ...styles.filterButton,
            ...(filter === 'read' ? styles.filterButtonActive : {}),
          }}
          onClick={() => setFilter('read')}
        >
          Leídas ({notifications.length - unreadCount})
        </button>
      </div>

      {filteredNotifications.length === 0 ? (
        <div style={styles.empty}>
          {filter === 'all' && 'No tienes notificaciones'}
          {filter === 'unread' && 'No tienes notificaciones sin leer'}
          {filter === 'read' && 'No tienes notificaciones leídas'}
        </div>
      ) : (
        <div style={styles.list}>
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              style={{
                ...styles.item,
                ...(notification.read ? {} : styles.unreadItem),
              }}
            >
              <div
                style={styles.itemMain}
                onClick={() => handleNotificationClick(notification)}
              >
                <div style={styles.itemIcon}>
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div style={styles.itemContent}>
                  <div style={styles.itemHeader}>
                    <h3 style={styles.itemTitle}>{notification.title}</h3>
                    {!notification.read && <div style={styles.unreadDot}></div>}
                  </div>
                  <p style={styles.itemMessage}>{notification.message}</p>
                  <div style={styles.itemTime}>
                    {formatDate(notification.created_at)}
                  </div>
                </div>
              </div>
              <div style={styles.itemActions}>
                {!notification.read && (
                  <button
                    style={styles.actionButton}
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Marcar como leída"
                  >
                    ✓
                  </button>
                )}
                <button
                  style={{ ...styles.actionButton, ...styles.deleteButton }}
                  onClick={() => handleDeleteClick(notification.id)}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '0 20px',
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#6b7280',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: 0,
  },
  markAllButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  filterButton: {
    background: 'transparent',
    border: '1px solid #d1d5db',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    background: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '16px',
    color: '#9ca3af',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  item: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    transition: 'box-shadow 0.2s',
  },
  unreadItem: {
    background: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  itemMain: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    cursor: 'pointer',
  },
  itemIcon: {
    fontSize: '32px',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  itemTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
  },
  unreadDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    flexShrink: 0,
  },
  itemMessage: {
    fontSize: '14px',
    color: '#4b5563',
    margin: '0 0 8px 0',
    lineHeight: '1.5',
  },
  itemTime: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  itemActions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  actionButton: {
    background: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  deleteButton: {
    ':hover': {
      borderColor: '#ef4444',
      color: '#ef4444',
    },
  },
};

export default NotificationsPage;
