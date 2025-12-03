// src/pages/OrderDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!id || !user) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`orders/${id}/`);
        setOrder(res.data);
        
        // cargar items si vienen en orden o hacer query separada
        if (res.data.items && Array.isArray(res.data.items)) {
          setItems(res.data.items);
        } else if (res.data.orderitems) {
          setItems(res.data.orderitems);
        } else {
          // intentar cargar items desde endpoint separado (si existe)
          try {
            const itemsRes = await api.get(`orders/${id}/items/`);
            setItems(Array.isArray(itemsRes.data) ? itemsRes.data : (itemsRes.data.results || []));
          } catch {
            setItems([]);
          }
        }
      } catch (err) {
        console.error('Order detail error:', err);
        const msg = err?.response?.status === 404 ? 'Pedido no encontrado' : 'No se pudo cargar el pedido';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user]);

  if (!user) {
    return <div style={{ padding: 20 }}>Necesitas iniciar sesión para ver este pedido.</div>;
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>Cargando pedido...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>{error || 'Pedido no encontrado'}</div>
        <Link to="/orders" style={styles.btnBack}>← Volver a mis pedidos</Link>
      </div>
    );
  }

  const statusInfo = statusColors[order.status] || statusColors.pending;
  const date = order.created_at ? new Date(order.created_at).toLocaleDateString('es-CO', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  }) : 'N/A';
  const timeline = [
    { key: 'pending', label: 'Pendiente' },
    { key: 'paid', label: 'Pagado' },
    { key: 'preparing', label: 'Preparando' },
    { key: 'dispatched', label: 'Despachado' },
    { key: 'delivered', label: 'Entregado' },
    { key: 'cancelled', label: 'Cancelado' },
  ];
  const currentIndex = timeline.findIndex(t => t.key === order.status);

  return (
    <div style={styles.container} className={mounted ? 'page-enter' : ''}>
      <style>{`
        .page-enter { animation: pageEnter 320ms ease both; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={styles.header}>
        <div>
          <Link to="/orders" style={styles.breadcrumb}>← Mis pedidos</Link>
          <h2 style={styles.h2}>Pedido #{order.id}</h2>
          <p style={styles.date}>{date}</p>
        </div>
        <div style={{ ...styles.statusBadge, background: statusInfo.bg, color: statusInfo.text }}>
          {statusInfo.label}
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.mainColumn}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Productos</h3>
            {items.length === 0 ? (
              <div style={styles.emptyItems}>No hay items en este pedido</div>
            ) : (
              <div style={styles.itemsList}>
                {items.map((item, idx) => (
                  <div key={item.id || idx} style={styles.item}>
                    <div style={styles.itemInfo}>
                      <div style={styles.itemName}>{item.product_name || item.name || `Producto #${item.product}`}</div>
                      <div style={styles.itemMeta}>
                        Cantidad: {item.quantity} × {fmt(item.price)}
                      </div>
                    </div>
                    <div style={styles.itemTotal}>{fmt(Number(item.price) * Number(item.quantity))}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.totals}>
              <div style={styles.totalRow}>
                <span>Subtotal</span>
                <span>{fmt(order.total)}</span>
              </div>
              <div style={{ ...styles.totalRow, ...styles.totalFinal }}>
                <span>Total</span>
                <span>{fmt(order.total)}</span>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Estado del pedido</h3>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${timeline.length}, 1fr)`, gap: 8 }}>
              {timeline.map((step, idx) => {
                const reached = idx <= currentIndex && currentIndex !== -1;
                return (
                  <div key={step.key} style={{ textAlign: 'center' }}>
                    <div style={{ height: 10, borderRadius: 999, background: reached ? '#10b981' : '#e5e7eb' }} />
                    <div style={{ fontSize: 12, marginTop: 6, color: reached ? '#065f46' : '#6b7280', fontWeight: reached ? 800 : 600 }}>{step.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: '#6b7280' }}>
              Estado actual: <strong style={{ color: '#111827' }}>{timeline[currentIndex]?.label || order.status}</strong>
            </div>
          </div>
        </div>

        <div style={styles.sidebar}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Información del pedido</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Tienda</div>
                <div style={styles.infoValue}>{order.shop_name || `Tienda #${order.shop}`}</div>
              </div>

              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Estado de pago</div>
                <div style={styles.infoValue}>
                  {order.payment_confirmed ? (
                    <span style={{ color: '#059669', fontWeight: 700 }}>✓ Pagado</span>
                  ) : (
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>✗ Pendiente</span>
                  )}
                </div>
              </div>

              {order.shipping_address && (
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Dirección de envío</div>
                  <div style={styles.infoValue}>{order.shipping_address}</div>
                </div>
              )}

              {order.tracking_number && (
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Número de seguimiento</div>
                  <div style={styles.infoValue}>{order.tracking_number}</div>
                </div>
              )}
            </div>
          </div>

          {!order.payment_confirmed && order.payment_url && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Acción requerida</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                Tu pedido está pendiente de pago
              </p>
              <a href={order.payment_url} style={styles.btnPayment} target="_blank" rel="noopener noreferrer">
                Pagar ahora
              </a>
            </div>
          )}
        </div>
      </div>
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
  breadcrumb: {
    fontSize: 13,
    color: '#6b7280',
    textDecoration: 'none',
    fontWeight: 600,
    display: 'block',
    marginBottom: 8,
  },
  h2: {
    margin: 0,
    fontSize: 28,
    fontWeight: 900,
    color: '#111827',
  },
  date: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#9ca3af',
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 20,
  },
  mainColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
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
  cardTitle: {
    margin: '0 0 16px',
    fontSize: 16,
    fontWeight: 800,
    color: '#111827',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid rgba(15,23,42,0.04)',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 700,
    color: '#111827',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
  itemTotal: {
    fontWeight: 800,
    color: '#111827',
    fontSize: 15,
  },
  emptyItems: {
    padding: 20,
    textAlign: 'center',
    color: '#9ca3af',
  },
  totals: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '2px solid rgba(15,23,42,0.06)',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: 14,
  },
  totalFinal: {
    fontSize: 18,
    fontWeight: 900,
    color: '#111827',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid rgba(15,23,42,0.04)',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  infoItem: {},
  infoLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 600,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: 600,
  },
  btnPayment: {
    display: 'block',
    textAlign: 'center',
    padding: '10px',
    background: '#111827',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 700,
  },
  loadingBox: {
    padding: 20,
    textAlign: 'center',
    color: '#6b7280',
  },
  errorBox: {
    padding: 14,
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 10,
    marginBottom: 16,
    fontWeight: 600,
  },
  btnBack: {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(17,24,39,0.1)',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#111827',
    fontWeight: 700,
  },
};
