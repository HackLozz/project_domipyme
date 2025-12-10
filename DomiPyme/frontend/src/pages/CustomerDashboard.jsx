// src/pages/CustomerDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import api from '../components/Api';
import { Link } from 'react-router-dom';
import './CustomerDashboard.css';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(n || 0));

const statusColors = {
  pending: { bg: '#fef3c7', text: '#92400e', label: 'Pendiente' },
  confirmed: { bg: '#dbeafe', text: '#1e40af', label: 'Confirmado' },
  shipped: { bg: '#e0e7ff', text: '#3730a3', label: 'Enviado' },
  delivered: { bg: '#d1fae5', text: '#065f46', label: 'Entregado' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelado' },
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const oRes = await api.get('orders/my/');
        if (!active) return;
        setOrders(Array.isArray(oRes.data) ? oRes.data : (oRes.data.results || []));
      } catch (e) {
        console.error('Load orders error:', e);
        if (active) setOrders([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (user) load();
    return () => { active = false; };
  }, [user]);

  if (!user) {
    return (
      <div className="customer-dashboard-page">
        <div className="customer-dashboard-container">
          <div className="customer-dashboard-error">
            <p>Necesitas iniciar sesión para ver el dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 5);
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const lastOrderDate = orders.length ? (orders[0].created_at || null) : null;

  return (
    <div className="customer-dashboard-page">
      <div className="customer-dashboard-container">
        <div className="customer-dashboard-header">
          <div className="customer-dashboard-welcome">
            <div className="customer-dashboard-avatar">
              {(user.first_name?.[0] || user.email?.[0] || '👤').toUpperCase()}
            </div>
            <div className="customer-dashboard-welcome-text">
              <h1>Hola, {user.first_name || user.email} 👋</h1>
              <p>Bienvenido a tu panel personal</p>
            </div>
          </div>

          <div className="customer-dashboard-stats">
            <div className="customer-dashboard-stat-card">
              <div className="customer-dashboard-stat-icon">📦</div>
              <p className="customer-dashboard-stat-label">Pedidos totales</p>
              <h3 className="customer-dashboard-stat-value">{orders.length}</h3>
            </div>

            <div className="customer-dashboard-stat-card">
              <div className="customer-dashboard-stat-icon">💰</div>
              <p className="customer-dashboard-stat-label">Total gastado</p>
              <h3 className="customer-dashboard-stat-value">{fmt(totalSpent)}</h3>
            </div>

            <div className="customer-dashboard-stat-card">
              <div className="customer-dashboard-stat-icon">✓</div>
              <p className="customer-dashboard-stat-label">Completados</p>
              <h3 className="customer-dashboard-stat-value">{deliveredCount}</h3>
            </div>

            {lastOrderDate && (
              <div className="customer-dashboard-stat-card">
                <div className="customer-dashboard-stat-icon">🕒</div>
                <p className="customer-dashboard-stat-label">Último pedido</p>
                <h3 className="customer-dashboard-stat-value">
                  {new Date(lastOrderDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                </h3>
              </div>
            )}
          </div>
        </div>

        <div className="customer-dashboard-section">
        <div style={styles.mainColumn}>
          <div style={styles.card}>
  
            // Advertencia si el usuario no está verificado
            const showVerifyWarning = user.is_verified === false;
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Pedidos recientes</h3>
              {orders.length > 0 && (
                <Link to="/orders" style={styles.linkAll}>Ver todos</Link>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: 12 }}>
                    <div style={{ width: 48, height: 40 }} className="skeleton" />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 14, width: '40%', marginBottom: 8 }} className="skeleton" />
                      <div style={{ height: 12, width: '60%' }} className="skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>🛒</div>
                <div style={styles.emptyTitle}>No tienes pedidos todavía</div>
                <p style={styles.emptyText}>Cuando realices una compra, aparecerá aquí</p>
                <Link to="/catalog" style={styles.btnPrimary}>Explorar catálogo</Link>
              </div>
            ) : (
              <div style={styles.ordersList}>
                {recentOrders.map((order) => {
                  const statusInfo = statusColors[order.status] || statusColors.pending;
                  const date = order.created_at ? new Date(order.created_at).toLocaleDateString('es-CO') : 'N/A';

                  return (
                    <Link key={order.id} to={`/orders/${order.id}`} style={styles.orderItem} className="card-hover">
                      <div style={styles.orderIcon}>📦</div>
                      <div style={styles.orderInfo}>
                        <div style={styles.orderTitle}>Pedido #{order.id}</div>
                        <div style={styles.orderMeta}>{date} · {order.shop_name || `Tienda #${order.shop}`}</div>
                      </div>
                      <div style={styles.orderRight}>
                        <div style={styles.orderTotal}>{fmt(order.total)}</div>
                        <div style={{ ...styles.orderBadge, background: statusInfo.bg, color: statusInfo.text }}>
                          {statusInfo.label}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={styles.sidebar}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Mi cuenta</h3>
            <div style={styles.accountInfo}>
              <div style={styles.accountItem}>
                <div style={styles.accountLabel}>Email</div>
                <div style={styles.accountValue}>{user.email}</div>
              </div>

              <div style={styles.accountItem}>
                <div style={styles.accountLabel}>Nombre</div>
                <div style={styles.accountValue}>{user.first_name} {user.last_name}</div>
              </div>

              <div style={styles.accountItem}>
                <div style={styles.accountLabel}>Rol</div>
                <div style={styles.accountValue}>
                  <span style={styles.roleBadge}>{user.role || 'customer'}</span>
                </div>
              </div>

              {user.phone && (
                <div style={styles.accountItem}>
                  <div style={styles.accountLabel}>Teléfono</div>
                  <div style={styles.accountValue}>{user.phone}</div>
                </div>
              )}
            </div>

            <Link to="/profile" style={styles.btnEdit}>Editar perfil</Link>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Acciones rápidas</h3>
            <div style={styles.quickActions}>
              <Link to="/catalog" style={styles.quickAction}>
                <span style={styles.quickActionIcon}>🛍️</span>
                <span>Ver catálogo</span>
              </Link>
              <Link to="/orders" style={styles.quickAction}>
                <span style={styles.quickActionIcon}>📋</span>
                <span>Mis pedidos</span>
              </Link>
              <Link to="/cart" style={styles.quickAction}>
                <span style={styles.quickActionIcon}>🛒</span>
                <span>Ver carrito</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    maxWidth: 1200,
    margin: '0 auto',
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  },
  header: {
    marginBottom: 24,
  },
  h2: {
    margin: 0,
    fontSize: 28,
    fontWeight: 900,
    color: '#111827',
  },
  subtitle: {
    margin: '4px 0 0',
    color: '#6b7280',
    fontSize: 14,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 4px 14px rgba(2,6,23,0.04)',
    border: '1px solid rgba(15,23,42,0.03)',
    textAlign: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 900,
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 20,
  },
  mainColumn: {},
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 4px 14px rgba(2,6,23,0.04)',
    border: '1px solid rgba(15,23,42,0.03)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: '#111827',
  },
  linkAll: {
    fontSize: 13,
    color: '#6b7280',
    textDecoration: 'none',
    fontWeight: 600,
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  orderItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    background: '#f9fafb',
    borderRadius: 10,
    textDecoration: 'none',
    border: '1px solid rgba(15,23,42,0.02)',
  },
  orderIcon: {
    fontSize: 24,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontWeight: 700,
    color: '#111827',
    fontSize: 14,
    marginBottom: 2,
  },
  orderMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  orderRight: {
    textAlign: 'right',
  },
  orderTotal: {
    fontWeight: 800,
    color: '#111827',
    fontSize: 15,
    marginBottom: 4,
  },
  orderBadge: {
    padding: '3px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    display: 'inline-block',
  },
  empty: {
    textAlign: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#374151',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  btnPrimary: {
    display: 'inline-block',
    padding: '10px 18px',
    background: '#111827',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 13,
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  accountItem: {},
  accountLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: 600,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  accountValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: 600,
  },
  roleBadge: {
    padding: '4px 10px',
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'capitalize',
  },
  btnEdit: {
    display: 'block',
    textAlign: 'center',
    padding: '10px',
    background: 'transparent',
    border: '1px solid rgba(17,24,39,0.1)',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#111827',
    fontWeight: 700,
    fontSize: 13,
  },
  quickActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  quickAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: '#f9fafb',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#111827',
    fontWeight: 600,
    fontSize: 13,
    border: '1px solid rgba(15,23,42,0.02)',
    transition: 'background 140ms ease',
  },
  quickActionIcon: {
    fontSize: 18,
  },
};
