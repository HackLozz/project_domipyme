// src/pages/MerchantPanel.jsx
import { useEffect, useState } from "react";
import api from "../components/Api";
import { useAuth } from "../context/AuthProvider";
import { Navigate, Link } from "react-router-dom";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(n || 0));

export default function MerchantPanel() {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersNext, setOrdersNext] = useState(null);
  const [ordersPrev, setOrdersPrev] = useState(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const pageSize = 12;
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // all | pending | approved | delivered
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [metrics, setMetrics] = useState({ lastOrderDate: null, approvedCount: 0 });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [editingStock, setEditingStock] = useState(null); // {productId, value}
  const [showInventory, setShowInventory] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | analytics

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "merchant") return;

    const load = async () => {
      setLoading(true);
      try {
        const [shopRes, productsRes, ordersRes] = await Promise.allSettled([
          api.get("shops/my/"),
          api.get(`products/my/?limit=${pageSize}&offset=${(productsPage-1)*pageSize}`),
          api.get(`orders/merchant/my/?limit=${pageSize}&offset=${(ordersPage-1)*pageSize}`)
        ]);

        if (shopRes.status === 'fulfilled') setShop(shopRes.value.data);
        if (productsRes.status === 'fulfilled') {
          const data = productsRes.value.data;
          setProducts(Array.isArray(data) ? data : (data.results || []));
        }
        if (ordersRes.status === 'fulfilled') {
          const data = ordersRes.value.data || {};
          const list = Array.isArray(data) ? data : (data.results || []);
          setOrders(list);
          setOrdersNext(data.next || null);
          setOrdersPrev(data.previous || null);
          setOrdersCount(data.count || 0);
          const approvedCount = list.filter(o => o.payment_confirmed).length;
          const lastOrderDate = list.length > 0 ? (list[0].created_at || null) : null;
          setMetrics({ approvedCount, lastOrderDate });
        }
      } catch (e) {
        console.error('Load merchant data error:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, ordersPage, productsPage]);

  if (!user || user.role !== "merchant") return <Navigate to="/" />;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>Cargando panel...</div>
      </div>
    );
  }

  const [stats, setStats] = useState(null);
  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        const resp = await api.get('orders/merchant/stats/');
        if (mounted) setStats(resp.data);
      } catch (e) {}
    };
    const loadLowStock = async () => {
      try {
        const resp = await api.get('products/low-stock/?threshold=10');
        if (mounted) {
          const data = resp.data;
          const list = Array.isArray(data) ? data : (data.results || []);
          setLowStockProducts(list);
        }
      } catch (e) {}
    };
    if (user && user.role === 'merchant') {
      loadStats();
      loadLowStock();
    }
    return () => { mounted = false; };
  }, [user]);

  const totalRevenue = stats?.revenue_approved ? Number(stats.revenue_approved) : orders.filter(o => o.payment_confirmed).reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingOrders = (stats?.pending ?? orders.filter(o => o.status === 'pending' || !o.payment_confirmed).length);

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'all') return true;
    if (orderStatusFilter === 'pending') return (o.status === 'pending' || !o.payment_confirmed);
    if (orderStatusFilter === 'approved') return !!o.payment_confirmed;
    if (orderStatusFilter === 'delivered') return o.status === 'delivered';
    return true;
  });

  const handleUpdateStock = async (productId, newStock) => {
    try {
      await api.patch(`products/${productId}/update-stock/`, { stock: newStock });
      // Actualizar localmente
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
      setLowStockProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
      setEditingStock(null);
    } catch (e) {
      console.error('Error updating stock:', e);
      alert('No se pudo actualizar el stock. Inténtalo de nuevo.');
    }
  };

  const handleToggleActive = async (productId, currentActive) => {
    try {
      const resp = await api.patch(`products/${productId}/toggle-active/`, { active: !currentActive });
      // Actualizar localmente
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, active: resp.data.active } : p));
      setLowStockProducts(prev => prev.map(p => p.id === productId ? { ...p, active: resp.data.active } : p));
    } catch (e) {
      console.error('Error toggling active:', e);
      alert('No se pudo cambiar el estado. Inténtalo de nuevo.');
    }
  };

  return (
    <div style={styles.container} className={mounted ? 'page-enter' : ''}>
      <style>{`
        .page-enter { animation: pageEnter 320ms ease both; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .card-hover { transition: transform 180ms ease, box-shadow 180ms ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(2,6,23,0.08); }
      `}</style>

      <div style={styles.header}>
        <div>
          <h2 style={styles.h2}>Panel de comerciante</h2>
          <p style={styles.subtitle}>Gestiona tu tienda, productos y pedidos</p>
        </div>
        {metrics.lastOrderDate && (
          <div style={{ color: '#6b7280', fontSize: 13 }}>Última orden: {new Date(metrics.lastOrderDate).toLocaleString('es-CO')}</div>
        )}
      </div>

      {/* Tabs de navegación */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            ...styles.tab,
            ...(activeTab === 'overview' ? styles.tabActive : {}),
          }}
        >
          📊 Resumen
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            ...styles.tab,
            ...(activeTab === 'analytics' ? styles.tabActive : {}),
          }}
        >
          📈 Analíticas
        </button>
      </div>

      {!shop ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🏪</div>
          <h3 style={styles.emptyTitle}>No tienes una tienda todavía</h3>
          <p style={styles.emptyText}>Crea tu tienda para empezar a vender productos en DomiPyme</p>
          <Link to="/merchant/shop/create" style={styles.btnPrimary}>Crear mi tienda</Link>
        </div>
      ) : activeTab === 'analytics' ? (
        <AnalyticsDashboard />
      ) : (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📦</div>
              <div style={styles.statValue}>{products.length}</div>
              <div style={styles.statLabel}>Productos activos</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>💰</div>
              <div style={styles.statValue}>{fmt(totalRevenue)}</div>
              <div style={styles.statLabel}>Ingresos totales</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>⏳</div>
              <div style={styles.statValue}>{pendingOrders}</div>
              <div style={styles.statLabel}>Pedidos pendientes</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>✓</div>
              <div style={styles.statValue}>{stats?.total ?? orders.length}</div>
              <div style={styles.statLabel}>Total pedidos</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🧾</div>
              <div style={styles.statValue}>{stats?.approved ?? metrics.approvedCount}</div>
              <div style={styles.statLabel}>Pagos aprobados</div>
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.mainColumn}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Mi tienda</h3>
                  <div style={styles.actions}>
                    <Link to={`/shop/${shop.slug}`} style={styles.btnView} target="_blank">
                      Ver pública
                    </Link>
                    <Link to="/merchant/shop/edit" style={styles.btnEdit}>
                      Editar
                    </Link>
                  </div>
                </div>

                <div style={styles.shopInfo}>
                  <div style={styles.shopName}>{shop.name}</div>
                  {shop.description && (
                    <div style={styles.shopDesc}>{shop.description}</div>
                  )}
                  <div style={styles.shopMeta}>
                    {shop.city && <span>📍 {shop.city}</span>}
                    {shop.active ? (
                      <span style={styles.badgeActive}>✓ Activa</span>
                    ) : (
                      <span style={styles.badgeInactive}>✗ Inactiva</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Alerta de stock bajo */}
              {lowStockProducts.length > 0 && (
                <div style={styles.alertCard}>
                  <div style={styles.alertHeader}>
                    <span style={styles.alertIcon}>⚠️</span>
                    <div>
                      <div style={styles.alertTitle}>Productos con stock bajo</div>
                      <div style={styles.alertText}>{lowStockProducts.length} producto(s) con stock ≤ 10</div>
                    </div>
                    <button
                      onClick={() => setShowInventory(!showInventory)}
                      style={styles.btnToggle}
                    >
                      {showInventory ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  
                  {showInventory && (
                    <div style={styles.inventoryList}>
                      {lowStockProducts.map(p => (
                        <div key={p.id} style={styles.inventoryItem}>
                          <div style={styles.inventoryInfo}>
                            <div style={styles.inventoryName}>{p.name}</div>
                            <div style={styles.inventoryMeta}>
                              {fmt(p.price)}
                              {p.stock === 0 ? (
                                <span style={styles.badgeDanger}>Sin stock</span>
                              ) : (
                                <span style={styles.badgeWarning}>Stock: {p.stock}</span>
                              )}
                            </div>
                          </div>
                          <div style={styles.inventoryActions}>
                            {editingStock?.productId === p.id ? (
                              <>
                                <input
                                  type="number"
                                  value={editingStock.value}
                                  onChange={(e) => setEditingStock({ productId: p.id, value: e.target.value })}
                                  style={styles.stockInput}
                                  autoFocus
                                  min="0"
                                />
                                <button
                                  onClick={() => handleUpdateStock(p.id, editingStock.value)}
                                  style={styles.btnSave}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingStock(null)}
                                  style={styles.btnCancel}
                                >
                                  ✗
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditingStock({ productId: p.id, value: p.stock })}
                                  style={styles.btnStock}
                                >
                                  Actualizar stock
                                </button>
                                <button
                                  onClick={() => handleToggleActive(p.id, p.active)}
                                  style={p.active ? styles.btnDeactivate : styles.btnActivate}
                                >
                                  {p.active ? 'Desactivar' : 'Activar'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Productos recientes</h3>
                  <Link to="/merchant/products" style={styles.linkAll}>Ver todos</Link>
                </div>

                {products.length === 0 ? (
                  <div style={styles.empty}>
                    <div style={styles.emptyIcon}>📦</div>
                    <div style={styles.emptyTitle}>No tienes productos</div>
                    <p style={styles.emptyText}>Agrega productos para empezar a vender</p>
                    <Link to="/merchant/products/create" style={styles.btnSecondary}>Crear producto</Link>
                  </div>
                ) : (
                  <div style={styles.productsList}>
                    {products.slice(0, 5).map((p) => (
                      <div key={p.id} style={styles.productItem}>
                        <div style={styles.productInfo}>
                          <div style={styles.productName}>
                            {p.name}
                            {p.stock <= 10 && <span style={styles.badgeWarningSmall}>⚠️</span>}
                            {!p.active && <span style={styles.badgeInactiveSmall}>Inactivo</span>}
                          </div>
                          <div style={styles.productMeta}>
                            {fmt(p.price)} · Stock: {p.stock || 0}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {editingStock?.productId === p.id ? (
                            <>
                              <input
                                type="number"
                                value={editingStock.value}
                                onChange={(e) => setEditingStock({ productId: p.id, value: e.target.value })}
                                style={styles.stockInputSmall}
                                autoFocus
                                min="0"
                              />
                              <button
                                onClick={() => handleUpdateStock(p.id, editingStock.value)}
                                style={styles.btnSmall}
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingStock(null)}
                                style={styles.btnSmall}
                              >
                                ✗
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingStock({ productId: p.id, value: p.stock })}
                                style={styles.btnSmall}
                              >
                                Stock
                              </button>
                              <Link to={`/merchant/products/${p.id}/edit`} style={styles.btnSmall}>
                                Editar
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <button disabled={productsPage<=1} onClick={()=>setProductsPage(p=>Math.max(1,p-1))} style={styles.btnSmall}>Anterior</button>
                  <button onClick={()=>setProductsPage(p=>p+1)} style={styles.btnSmall}>Siguiente</button>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Órdenes recientes</h3>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['all','pending','approved','delivered'].map(s => (
                      <button key={s} onClick={() => setOrderStatusFilter(s)} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #e5e7eb', background: orderStatusFilter===s?'#111827':'transparent', color: orderStatusFilter===s?'#fff':'#111827', cursor:'pointer', fontWeight:700 }}>
                        {s === 'all' ? 'Todas' : (s === 'pending' ? 'Pendientes' : (s === 'approved' ? 'Aprobadas' : 'Entregadas'))}
                      </button>
                    ))}
                  </div>
                </div>
                {filteredOrders.length === 0 ? (
                  <div style={styles.empty}>
                    <div style={styles.emptyIcon}>📭</div>
                    <div style={styles.emptyTitle}>No hay órdenes</div>
                    <p style={styles.emptyText}>Aún no tienes órdenes en este filtro</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredOrders.slice(0, 8).map(o => (
                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 10, border: '1px solid #eef1f5' }}>
                        <div>
                          <div style={{ fontWeight: 800 }}>Pedido #{o.id}</div>
                          <div style={{ color: '#6b7280', fontSize: 12 }}>{new Date(o.created_at).toLocaleString('es-CO')}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontWeight: 800 }}>{new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP'}).format(Number(o.total||0))}</div>
                          <span style={{ background: o.payment_confirmed?'#ecfdf5':'#fffbeb', color: o.payment_confirmed?'#065f46':'#92400e', padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 800 }}>{o.payment_confirmed?'Aprobado':'Pendiente'}</span>
                          <select onChange={async (e)=>{
                            const next = e.target.value;
                            if (!next) return;
                            try {
                              await api.put(`orders/${o.id}/status/`, { status: next });
                              // refresh orders list
                              const resp = await api.get(`orders/merchant/my/?limit=${pageSize}&offset=${(ordersPage-1)*pageSize}`);
                              const list = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
                              setOrders(list);
                            } catch (err) { console.error('Status update failed', err); }
                          }} defaultValue="">
                            <option value="" disabled>Actualizar estado</option>
                            {o.status === 'pending' && (<>
                              <option value="paid">Marcar pagado</option>
                              <option value="cancelled">Cancelar</option>
                            </>)}
                            {o.status === 'paid' && (<>
                              <option value="preparing">Preparando</option>
                              <option value="cancelled">Cancelar</option>
                            </>)}
                            {o.status === 'preparing' && (<>
                              <option value="dispatched">Despachado</option>
                              <option value="cancelled">Cancelar</option>
                            </>)}
                            {o.status === 'dispatched' && (<option value="delivered">Entregado</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <button disabled={!ordersPrev} onClick={()=>setOrdersPage(p=>Math.max(1,p-1))} style={styles.btnSmall}>Anterior</button>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Página {ordersPage} {ordersCount > 0 && `de ${Math.ceil(ordersCount/pageSize)}`}</div>
                  <button disabled={!ordersNext} onClick={()=>setOrdersPage(p=>p+1)} style={styles.btnSmall}>Siguiente</button>
                </div>
              </div>
            </div>

            <div style={styles.sidebar}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Acciones rápidas</h3>
                <div style={styles.quickActions}>
                  <Link to="/merchant/products/create" style={styles.quickAction}>
                    <span style={styles.quickActionIcon}>➕</span>
                    <span>Crear producto</span>
                  </Link>
                  <Link to="/merchant/products" style={styles.quickAction}>
                    <span style={styles.quickActionIcon}>📦</span>
                    <span>Administrar productos</span>
                  </Link>
                  <Link to="/merchant/shop/edit" style={styles.quickAction}>
                    <span style={styles.quickActionIcon}>⚙️</span>
                    <span>Configurar tienda</span>
                  </Link>
                  <Link to={`/shop/${shop.slug}`} style={styles.quickAction} target="_blank">
                    <span style={styles.quickActionIcon}>🔗</span>
                    <span>Ver mi tienda</span>
                  </Link>
                </div>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Pedidos recientes</h3>
                {orders.length === 0 ? (
                  <div style={styles.emptySmall}>Sin pedidos</div>
                ) : (
                  <div style={styles.ordersList}>
                    {orders.slice(0, 3).map((o) => (
                      <div key={o.id} style={styles.orderItem}>
                        <div style={styles.orderInfo}>
                          <div style={styles.orderTitle}>#{o.id}</div>
                          <div style={styles.orderMeta}>{fmt(o.total)}</div>
                        </div>
                        <div style={o.payment_confirmed ? styles.statusPaid : styles.statusPending}>
                          {o.payment_confirmed ? '✓' : '⏳'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
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
  loadingBox: {
    padding: 40,
    textAlign: 'center',
    color: '#6b7280',
  },
  emptyState: {
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
    color: '#374151',
    margin: '0 0 8px',
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
  actions: {
    display: 'flex',
    gap: 8,
  },
  btnView: {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid rgba(17,24,39,0.1)',
    borderRadius: 6,
    textDecoration: 'none',
    color: '#111827',
    fontSize: 13,
    fontWeight: 600,
  },
  btnEdit: {
    padding: '6px 12px',
    background: '#111827',
    color: '#fff',
    borderRadius: 6,
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 700,
  },
  shopInfo: {
    padding: 16,
    background: '#f9fafb',
    borderRadius: 10,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 800,
    color: '#111827',
    marginBottom: 6,
  },
  shopDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  shopMeta: {
    fontSize: 13,
    color: '#9ca3af',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  badgeActive: {
    padding: '3px 8px',
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  },
  badgeInactive: {
    padding: '3px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  },
  // Inventory styles
  alertCard: {
    background: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    border: '1px solid #fbbf24',
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  alertIcon: {
    fontSize: 24,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#92400e',
  },
  alertText: {
    fontSize: 13,
    color: '#b45309',
    marginTop: 2,
  },
  btnToggle: {
    marginLeft: 'auto',
    padding: '6px 12px',
    background: '#fff',
    border: '1px solid #fbbf24',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    color: '#92400e',
  },
  inventoryList: {
    marginTop: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  inventoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    background: '#fff',
    borderRadius: 8,
    border: '1px solid #fbbf24',
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 4,
  },
  inventoryMeta: {
    fontSize: 12,
    color: '#6b7280',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  inventoryActions: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  stockInput: {
    width: 80,
    padding: '6px 8px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
  },
  stockInputSmall: {
    width: 60,
    padding: '4px 6px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 12,
  },
  btnSave: {
    padding: '6px 10px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  btnCancel: {
    padding: '6px 10px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  btnStock: {
    padding: '6px 10px',
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  btnActivate: {
    padding: '6px 10px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  btnDeactivate: {
    padding: '6px 10px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  badgeDanger: {
    padding: '3px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  },
  badgeWarning: {
    padding: '3px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  },
  badgeWarningSmall: {
    marginLeft: 6,
    fontSize: 14,
  },
  badgeInactiveSmall: {
    marginLeft: 6,
    padding: '2px 6px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  linkAll: {
    fontSize: 13,
    color: '#6b7280',
    textDecoration: 'none',
    fontWeight: 600,
  },
  empty: {
    textAlign: 'center',
    padding: 30,
  },
  emptySmall: {
    textAlign: 'center',
    padding: 20,
    fontSize: 13,
    color: '#9ca3af',
  },
  btnSecondary: {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(17,24,39,0.1)',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#111827',
    fontWeight: 700,
    fontSize: 13,
  },
  productsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  productItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    background: '#f9fafb',
    borderRadius: 8,
    border: '1px solid rgba(15,23,42,0.02)',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: 700,
    color: '#111827',
    fontSize: 14,
    marginBottom: 2,
  },
  productMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  btnSmall: {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid rgba(17,24,39,0.1)',
    borderRadius: 6,
    textDecoration: 'none',
    color: '#111827',
    fontSize: 12,
    fontWeight: 600,
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
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    background: '#f9fafb',
    borderRadius: 6,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: '#111827',
  },
  orderMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusPaid: {
    color: '#059669',
    fontSize: 16,
  },
  statusPending: {
    color: '#f59e0b',
    fontSize: 16,
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '0',
  },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    transition: 'all 200ms ease',
    marginBottom: '-2px',
  },
  tabActive: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
    fontWeight: '600',
  },
};
