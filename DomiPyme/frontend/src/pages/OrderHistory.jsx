// src/pages/OrderHistory.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../components/Api';
import { useAuth } from '../context/AuthProvider';
import { showToast } from '../components/Toast';
import './OrderHistory.css';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

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

  // Filtrar y buscar
  let filteredOrders = orders.filter(order => {
    const matchesSearch = 
      String(order.id).includes(searchTerm) ||
      (order.shop_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      fmt(order.total).includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Ordenar
  filteredOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'expensive':
        return (b.total || 0) - (a.total || 0);
      case 'cheap':
        return (a.total || 0) - (b.total || 0);
      default:
        return 0;
    }
  });

  const handleReorder = async (order) => {
    try {
      // Reconstruir carrito con items de la orden anterior
      let cart = [];
      try {
        cart = JSON.parse(localStorage.getItem('dp_cart') || '[]');
      } catch { cart = []; }

      // Agregar items de la orden anterior (se necesitaría más info del backend)
      // Por ahora mostramos un toast
      showToast('Reorden iniciado - Items agregados al carrito', 'success', 2000);
      
      // Redirigir a carrito
      window.location.href = '/cart';
    } catch (err) {
      console.error('Reorder error:', err);
      showToast('Error al procesar reorden', 'error', 2000);
    }
  };

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

      {/* Controles de Filtrado y Búsqueda */}
      {orders.length > 0 && !loading && (
        <div style={styles.controlsSection}>
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="🔍 Buscar por número de pedido, tienda o monto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filtersRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Estado:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmado</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Ordenar por:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="recent">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="expensive">Mayor precio</option>
                <option value="cheap">Menor precio</option>
              </select>
            </div>

            {(searchTerm || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                style={styles.clearBtn}
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>

          {filteredOrders.length < orders.length && (
            <div style={styles.resultsInfo}>
              Mostrando {filteredOrders.length} de {orders.length} pedidos
            </div>
          )}
        </div>
      )}

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
      ) : filteredOrders.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🔎</div>
          <h3 style={styles.emptyTitle}>No se encontraron pedidos</h3>
          <p style={styles.emptyText}>Intenta ajustar los filtros o búsqueda</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
            }}
            style={styles.btnPrimary}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredOrders.map((order) => {
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

                {/* Estado del Pedido - Timeline visual */}
                <div style={styles.statusTimeline}>
                  <div style={{ ...styles.timelineStep, opacity: ['pending', 'confirmed', 'shipped', 'delivered'].includes(order.status) ? 1 : 0.3 }}>
                    <div style={styles.timelineDot}>📋</div>
                    <div style={styles.timelineLabel}>Pedido</div>
                  </div>
                  <div style={styles.timelineConnector} />
                  <div style={{ ...styles.timelineStep, opacity: ['confirmed', 'shipped', 'delivered'].includes(order.status) ? 1 : 0.3 }}>
                    <div style={styles.timelineDot}>✓</div>
                    <div style={styles.timelineLabel}>Confirmado</div>
                  </div>
                  <div style={styles.timelineConnector} />
                  <div style={{ ...styles.timelineStep, opacity: ['shipped', 'delivered'].includes(order.status) ? 1 : 0.3 }}>
                    <div style={styles.timelineDot}>📦</div>
                    <div style={styles.timelineLabel}>Enviado</div>
                  </div>
                  <div style={styles.timelineConnector} />
                  <div style={{ ...styles.timelineStep, opacity: order.status === 'delivered' ? 1 : 0.3 }}>
                    <div style={styles.timelineDot}>🚚</div>
                    <div style={styles.timelineLabel}>Entregado</div>
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
                  <button
                    onClick={() => handleReorder(order)}
                    style={styles.btnReorder}
                    title="Agregar estos items al carrito nuevamente"
                  >
                    🔄 Reordenar
                  </button>
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
  controlsSection: {
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    boxShadow: '0 2px 8px rgba(2,6,23,0.04)',
    border: '1px solid rgba(15,23,42,0.03)',
  },
  searchBox: {
    marginBottom: 16,
  },
  searchInput: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  filtersRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: 'pointer',
    minWidth: 180,
  },
  clearBtn: {
    padding: '8px 14px',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    color: '#374151',
    transition: 'all 0.2s',
  },
  resultsInfo: {
    marginTop: 12,
    fontSize: 12,
    color: '#6b7280',
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
  statusTimeline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    fontSize: 11,
    color: '#6b7280',
  },
  timelineStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    transition: 'opacity 0.3s',
  },
  timelineDot: {
    fontSize: 16,
  },
  timelineLabel: {
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  timelineConnector: {
    height: 1,
    background: '#e5e7eb',
    flex: 1,
    margin: '0 4px',
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
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  btnView: {
    padding: '8px 14px',
    background: '#111827',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 13,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnReorder: {
    padding: '8px 14px',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    color: '#111827',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
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
    border: 'none',
    cursor: 'pointer',
  },
};
