import { useState, useEffect, useRef } from 'react';
import api from './Api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count on mount and every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      fetchRecentNotifications();
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/auth/notifications/unread-count/');
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchRecentNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/notifications/recent/?limit=10');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/auth/notifications/${id}/mark-as-read/`);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/auth/notifications/mark-all-as-read/');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link_url) {
      window.location.href = notification.link_url;
    }
    setShowDropdown(false);
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

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString();
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button
        style={styles.bellButton}
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <h3 style={styles.title}>Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                style={styles.markAllButton}
                onClick={handleMarkAllAsRead}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {loading ? (
            <div style={styles.loading}>Cargando...</div>
          ) : notifications.length === 0 ? (
            <div style={styles.empty}>No hay notificaciones</div>
          ) : (
            <div style={styles.list}>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  style={{
                    ...styles.item,
                    ...(notification.read ? {} : styles.unreadItem),
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div style={styles.itemIcon}>
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div style={styles.itemContent}>
                    <div style={styles.itemTitle}>{notification.title}</div>
                    <div style={styles.itemMessage}>{notification.message}</div>
                    <div style={styles.itemTime}>
                      {formatTime(notification.created_at)}
                    </div>
                  </div>
                  {!notification.read && <div style={styles.unreadDot}></div>}
                </div>
              ))}
            </div>
          )}

          <div style={styles.footer}>
            <a href="/notifications" style={styles.viewAllLink}>
              Ver todas las notificaciones
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  bellButton: {
    position: 'relative',
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    transition: 'background-color 0.2s',
  },
  badge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    background: '#ef4444',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    borderRadius: '10px',
    padding: '2px 5px',
    minWidth: '18px',
    textAlign: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: '0',
    marginTop: '8px',
    width: '380px',
    maxHeight: '500px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  markAllButton: {
    background: 'transparent',
    border: 'none',
    color: '#3b82f6',
    fontSize: '12px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  loading: {
    padding: '32px',
    textAlign: 'center',
    color: '#6b7280',
  },
  empty: {
    padding: '32px',
    textAlign: 'center',
    color: '#6b7280',
  },
  list: {
    overflowY: 'auto',
    maxHeight: '350px',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f9fafb',
    },
  },
  unreadItem: {
    backgroundColor: '#eff6ff',
  },
  itemIcon: {
    fontSize: '24px',
    marginRight: '12px',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontWeight: '600',
    fontSize: '14px',
    marginBottom: '4px',
  },
  itemMessage: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  itemTime: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    flexShrink: 0,
    marginLeft: '8px',
    marginTop: '4px',
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center',
  },
  viewAllLink: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
};

export default NotificationBell;
