// src/pages/OrderHistory.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../components/Api';
import { useAuth } from '../context/AuthProvider';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(n || 0));

const statusColors = {
  pending: { bg: '#fef3c7', text: '#92400e', label: 'Pendiente' },
  confirmed: { bg: '#dbeafe', text: '#1e40af', label: 'Confirmado' },
  shipped: { bg: '#e0e7ff', text: '#3730a3', label: 'Enviado' },
  delivered: { bg: '#d1fae5', text: '#065f46', label: 'Entregado' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelado' },
};

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('orders/my/');
        setOrders(Array.isArray(res.data) ? res.data : (res.data.results || []));
      } catch (err) {
        console.error('Orders load error:', err);
        setError('No se pudieron cargar tus pedidos.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  if (!user) {
    return <div style={{ padding: 20 }}>Necesitas iniciar sesión para ver tus pedidos.</div>;
  }

  return (
    <div style={styles.container} className={mounted ? 'page-enter' : ''}>
      <style>{`
        .page-enter { animation: pageEnter 320ms ease both; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .order-card { transition: transform 180ms ease, box-shadow 180ms ease; }
        .order-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(2,6,23,0.08); }

        .skeleton { background: linear-gradient(90deg,#f3f4f6 0%, #efefef 50%, #f3f4f6 100%); background-size: 200% 100%; animation: shimmer 1200ms linear infinite; border-radius: 6px; }
        @keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
      `}</style>

      <div style={styles.header}>
        <div>
          <h2 style={styles.h2}>Mis pedidos</h2>
          <p style={styles.subtitle}>Historial completo de tus compras</p>
        </div>
        <Link to="/dashboard" style={styles.btnBack}>← Volver al dashboard</Link>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading ? (
        <div style={styles.grid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={styles.card}>
              <div style={{ height: 16, width: '30%' }} className="skeleton" />
              <div style={{ height: 12, width: '50%', marginTop: 8 }} className="skeleton" />
              <div style={{ height: 14, width: '40%', marginTop: 12 }} className="skeleton" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>No tienes pedidos todavía</h3>
          <p style={styles.emptyText}>Cuando realices una compra, aparecerá aquí</p>
          <Link to="/catalog" style={styles.btnPrimary}>Explorar catálogo</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {orders.map((order) => {
            const statusInfo = statusColors[order.status] || statusColors.pending;
            const date = order.created_at ? new Date(order.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

            return (
              <div key={order.id} style={styles.card} className="order-card">
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.orderId}>Pedido #{order.id}</div>
                    <div style={styles.date}>{date}</div>
                  </div>
                  <div style={{ ...styles.badge, background: statusInfo.bg, color: statusInfo.text }}>
                    {statusInfo.label}
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.shopName}>
                    {order.shop_name || `Tienda #${order.shop}`}
                  </div>
                  <div style={styles.total}>{fmt(order.total)}</div>
                </div>

                <div style={styles.cardFooter}>
                  <Link to={`/orders/${order.id}`} style={styles.btnView}>
                    Ver detalles
                  </Link>
                  {order.payment_confirmed && (
                    <div style={styles.paidBadge}>✓ Pagado</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    maxWidth: 1100,
    margin: '0 auto',
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
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
  btnBack: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(17,24,39,0.1)',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#111827',
    fontWeight: 700,
  },
  errorBox: {
    padding: 14,
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 10,
    marginBottom: 20,
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 4px 14px rgba(2,6,23,0.04)',
    border: '1px solid rgba(15,23,42,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontWeight: 800,
    fontSize: 15,
    color: '#111827',
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  badge: {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
  },
  cardBody: {
    borderTop: '1px solid rgba(15,23,42,0.04)',
    borderBottom: '1px solid rgba(15,23,42,0.04)',
    paddingTop: 12,
    paddingBottom: 12,
  },
  shopName: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  total: {
    fontSize: 20,
    fontWeight: 900,
    color: '#111827',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnView: {
    padding: '8px 14px',
    background: '#111827',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 13,
  },
  paidBadge: {
    fontSize: 12,
    color: '#059669',
    fontWeight: 700,
  },
  empty: {
    textAlign: 'center',
    padding: 60,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 14px rgba(2,6,23,0.04)',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 800,
    margin: '0 0 8px',
    color: '#374151',
  },
  emptyText: {
    color: '#6b7280',
    marginBottom: 20,
  },
  btnPrimary: {
    display: 'inline-block',
    padding: '10px 20px',
    background: '#111827',
    color: '#fff',
    borderRadius: 10,
    textDecoration: 'none',
    fontWeight: 700,
  },
};
