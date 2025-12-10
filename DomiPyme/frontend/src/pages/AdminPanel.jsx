// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import api from '../components/Api';
import { useAuth } from '../context/AuthProvider';
import { Navigate } from 'react-router-dom';

export default function AdminPanel() {
    // Funciones de acción para admin
    const handleShopEdit = (shop) => {
      window.open(`/admin/shops/${shop.id}/edit`, '_blank');
    };
    const handleShopDelete = async (shop) => {
      if (window.confirm('¿Eliminar tienda ' + shop.name + '?')) {
        try {
          await api.delete(`shops/${shop.id}/`);
          setShops((prev) => prev.filter(s => s.id !== shop.id));
          alert('Tienda eliminada correctamente');
        } catch (err) {
          alert('Error al eliminar tienda');
        }
      }
    };
    const handleShopToggle = async (shop) => {
      try {
        await api.patch(`shops/${shop.id}/`, { active: !shop.active });
        setShops((prev) => prev.map(s => s.id === shop.id ? { ...s, active: !s.active } : s));
        alert(shop.active ? 'Tienda desactivada' : 'Tienda activada');
      } catch (err) {
        alert('Error al cambiar estado de tienda');
      }
    };
    const handleProductEdit = (product) => {
      window.open(`/admin/products/${product.id}/edit`, '_blank');
    };
    const handleProductDelete = async (product) => {
      if (window.confirm('¿Eliminar producto ' + product.name + '?')) {
        try {
          await api.delete(`products/${product.id}/`);
          setProducts((prev) => prev.filter(p => p.id !== product.id));
          alert('Producto eliminado correctamente');
        } catch (err) {
          alert('Error al eliminar producto');
        }
      }
    };
    const handleProductToggle = async (product) => {
      try {
        await api.patch(`products/${product.id}/toggle-active/`);
        setProducts((prev) => prev.map(p => p.id === product.id ? { ...p, active: !p.active } : p));
        alert(product.active ? 'Producto desactivado' : 'Producto activado');
      } catch (err) {
        alert('Error al cambiar estado de producto');
      }
    };
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [shopsNext, setShopsNext] = useState(null);
  const [shopsPrev, setShopsPrev] = useState(null);
  const [shopsCount, setShopsCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [usersNext, setUsersNext] = useState(null);
  const [usersPrev, setUsersPrev] = useState(null);
  const [usersCount, setUsersCount] = useState(0);
  const [products, setProducts] = useState([]);
  const [productsNext, setProductsNext] = useState(null);
  const [productsPrev, setProductsPrev] = useState(null);
  const [productsCount, setProductsCount] = useState(0);
  const [shopsPage, setShopsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const pageSize = 12;

  const [searchShop, setSearchShop] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchProduct, setSearchProduct] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      setError(null);
      try {
        const shopParams = new URLSearchParams({ limit: pageSize, offset: (shopsPage-1)*pageSize });
        if (searchShop) shopParams.append('search', searchShop);
        const userParams = new URLSearchParams({ limit: pageSize, offset: (usersPage-1)*pageSize });
        if (searchUser) userParams.append('search', searchUser);
        const productParams = new URLSearchParams({ limit: pageSize, offset: (productsPage-1)*pageSize });
        if (searchProduct) productParams.append('search', searchProduct);
        
        const [st, s, u, p] = await Promise.all([
          api.get('auth/admin/stats/'),
          api.get(`shops/?${shopParams.toString()}`),
          api.get(`auth/users/?${userParams.toString()}`),
          api.get(`products/?${productParams.toString()}`),
        ]);
        setStats(st.data || null);
        const sData = s.data || {};
        const uData = u.data || {};
        const pData = p.data || {};
        setShops(Array.isArray(sData.results) ? sData.results : (sData || []));
        setUsers(Array.isArray(uData.results) ? uData.results : (uData || []));
        setProducts(Array.isArray(pData.results) ? pData.results : (pData || []));
        setShopsNext(sData.next || null); setShopsPrev(sData.previous || null);
        setUsersNext(uData.next || null); setUsersPrev(uData.previous || null);
        setProductsNext(pData.next || null); setProductsPrev(pData.previous || null);
        setShopsCount(sData.count || 0); setUsersCount(uData.count || 0); setProductsCount(pData.count || 0);
      } catch (err) {
        console.error('Admin load error', err);
        setError('No se pudo cargar datos administrativos');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [shopsPage, usersPage, productsPage, searchShop, searchUser, searchProduct]);

  if (loading) return <div style={mini.loadingWrap}>Cargando...</div>;
  if (!user || !user.is_staff) return <Navigate to="/" replace />;

  // Los datos ya vienen filtrados del backend

  return (
    <div style={{...styles.page, background: 'linear-gradient(120deg, #f0f4ff 0%, #f8fafc 100%)', minHeight: '100vh'}} className={mounted ? 'page-enter' : ''}>
      <style>{`
        .page-enter { animation: pageEnter 320ms ease both; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .card { transition: transform 160ms ease, box-shadow 160ms ease; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(2,6,23,0.10); }
        .row:hover { background: rgba(249,250,251,0.7); }
        @media (max-width: 900px) {
          .admin-grid { grid-template-columns: 1fr !important; }
          .admin-aside { margin-top: 24px !important; }
        }
        @media (max-width: 600px) {
          .admin-stats { grid-template-columns: 1fr 1fr !important; }
          .admin-table th, .admin-table td { font-size: 12px !important; padding: 6px 4px !important; }
        }
      `}</style>

      <header style={{...styles.header, paddingTop: 16, paddingBottom: 16}}>
        <div>
          <h1 style={{...styles.h2, fontSize: 30, color: '#1d3557', letterSpacing: '-1px'}}>Panel administrativo</h1>
          <p style={{...styles.subtitle, fontSize: 16}}>Gestiona tiendas, usuarios y productos de la plataforma</p>
        </div>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}

      <section style={{...styles.statsGrid, marginBottom: 24}} className="admin-stats">
        <div style={{...styles.statCard, background: 'linear-gradient(120deg, #e0e7ff 0%, #fff 100%)'}} className="card">
          <div style={styles.statIcon}>🏪</div>
          <div style={styles.statValue}>{fetching ? '...' : (stats?.shops?.total ?? shops.length)}</div>
          <div style={styles.statLabel}>Tiendas</div>
        </div>
        <div style={{...styles.statCard, background: 'linear-gradient(120deg, #f1f5f9 0%, #fff 100%)'}} className="card">
          <div style={styles.statIcon}>👥</div>
          <div style={styles.statValue}>{fetching ? '...' : (stats?.users?.total ?? users.length)}</div>
          <div style={styles.statLabel}>Usuarios</div>
        </div>
        <div style={{...styles.statCard, background: 'linear-gradient(120deg, #fef9c3 0%, #fff 100%)'}} className="card">
          <div style={styles.statIcon}>📦</div>
          <div style={styles.statValue}>{fetching ? '...' : (stats?.products?.total ?? products.length)}</div>
          <div style={styles.statLabel}>Productos</div>
        </div>
        <div style={{...styles.statCard, background: 'linear-gradient(120deg, #dcfce7 0%, #fff 100%)'}} className="card">
          <div style={styles.statIcon}>🟢</div>
          <div style={styles.statValue}>{fetching ? '...' : (stats?.users?.active ?? users.filter(u=>u.is_active).length)}</div>
          <div style={styles.statLabel}>Usuarios activos</div>
        </div>
      </section>

      {/* Mini gráficos: Órdenes hoy vs últimos 7 días, y revenue hoy vs total */}
      <section style={{ ...styles.tableCard, marginBottom: 20, background: 'linear-gradient(120deg, #f0fdf4 0%, #fff 100%)' }} className="card">
        <div style={styles.sectionHead}>
          <h2 style={{...styles.h3, fontSize: 18, color: '#0e7490'}}>Actividad reciente</h2>
          <div style={{ color: '#6b7280', fontSize: 12 }}>
            {stats?.generated_at ? new Date(stats.generated_at).toLocaleString('es-CO') : ''}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Órdenes</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, minHeight: 120 }}>
              {(() => {
                const today = Number(stats?.orders?.today || 0);
                const last7 = Number(stats?.orders?.last7 || 0);
                const max = Math.max(today, last7, 1);
                return (
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: `${(today/max)*100}%`, background: '#3b82f6', borderRadius: 8, transition: 'height 0.4s' }} />
                      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12 }}>Hoy ({today})</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: `${(last7/max)*100}%`, background: '#0ea5e9', borderRadius: 8, transition: 'height 0.4s' }} />
                      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12 }}>Últimos 7 ({last7})</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Ingresos</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, minHeight: 120 }}>
              {(() => {
                const today = Number(stats?.revenue?.today || 0);
                const total = Number(stats?.revenue?.total || 0);
                const max = Math.max(today, total, 1);
                return (
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: `${(today/max)*100}%`, background: '#22c55e', borderRadius: 8, transition: 'height 0.4s' }} />
                      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12 }}>Hoy</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: `${(total/max)*100}%`, background: '#10b981', borderRadius: 8, transition: 'height 0.4s' }} />
                      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12 }}>Total</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      <main style={{...styles.grid, marginTop: 24}} className="admin-grid">
        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <h2 style={{...styles.h3, fontSize: 17, color: '#1d3557'}}>Tiendas</h2>
            <input value={searchShop} onChange={(e)=>setSearchShop(e.target.value)} placeholder="Buscar tienda..." style={styles.search} />
          </div>
          <div style={{...styles.tableCard, overflowX: 'auto'}} className="card admin-table">
            {fetching ? (
              <div style={styles.loading}>Cargando tiendas...</div>
            ) : shops.length === 0 ? (
              <div style={styles.empty}>No hay tiendas</div>
            ) : (
              <table style={{...styles.table, minWidth: 600}}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Nombre</th>
                    <th style={styles.th}>Slug</th>
                    <th style={styles.th}>Ciudad</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map((s) => (
                    <tr key={s.id} style={styles.tr} className="row">
                      <td style={styles.td}>{s.id}</td>
                      <td style={styles.td}><strong>{s.name}</strong></td>
                      <td style={styles.td}><code style={styles.code}>{s.slug}</code></td>
                      <td style={styles.td}>{s.city || '—'}</td>
                      <td style={styles.td}>
                        <a href={`/shop/${encodeURIComponent(s.slug || s.id)}`} target="_blank" rel="noreferrer" style={{...styles.btnSmall, background:'#e0e7ff'}}>Ver</a>
                        <button style={{...styles.btnSmall, background:'#f1f5f9'}} onClick={()=>handleShopEdit(s)}>Editar</button>
                        <button style={{...styles.btnSmall, color:'#fff', background:'#ef4444'}} onClick={()=>handleShopDelete(s)}>Eliminar</button>
                        <button style={{...styles.btnSmall, background: s.active ? '#fef9c3' : '#dcfce7', color: '#1d3557'}} onClick={()=>handleShopToggle(s)}>{s.active ? 'Desactivar' : 'Activar'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <button disabled={!shopsPrev} onClick={()=>setShopsPage(p=>Math.max(1,p-1))} style={styles.btnSmall}>Anterior</button>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Página {shopsPage} {shopsCount > 0 && `de ${Math.ceil(shopsCount/pageSize)}`}</div>
              <button disabled={!shopsNext} onClick={()=>setShopsPage(p=>p+1)} style={styles.btnSmall}>Siguiente</button>
            </div>
          </div>
        </section>

        <aside style={{...styles.aside, marginTop: 0}} className="admin-aside">
          <div style={{...styles.tableCard, overflowX: 'auto'}} className="card">
            <div style={styles.sectionHead}>
              <h2 style={{...styles.h3, fontSize: 17, color: '#1d3557'}}>Usuarios</h2>
              <input value={searchUser} onChange={(e)=>setSearchUser(e.target.value)} placeholder="Buscar usuario..." style={styles.search} />
            </div>
            {fetching ? (
              <div style={styles.loading}>Cargando usuarios...</div>
            ) : users.length === 0 ? (
              <div style={styles.empty}>No hay usuarios</div>
            ) : (
              <ul style={styles.list}>
                {users.map(u => (
                  <li key={u.id} style={styles.listItem} className="row">
                    <div>
                      <div style={styles.itemTitle}>{u.email || u.username}</div>
                      <div style={styles.itemMeta}>{u.is_staff ? 'Admin' : (u.role || 'Cliente')}</div>
                    </div>
                    <span style={u.is_active ? styles.badgeActive : styles.badgeInactive}>{u.is_active ? 'Activo' : 'Inactivo'}</span>
                    <button style={{...styles.btnSmall, background:'#f1f5f9'}} onClick={()=>handleUserEdit(u)}>Editar</button>
                    <button style={{...styles.btnSmall, color:'#fff', background:'#ef4444'}} onClick={()=>handleUserDelete(u)}>Eliminar</button>
                    <button style={{...styles.btnSmall, background: u.is_active ? '#fef9c3' : '#dcfce7', color: '#1d3557'}} onClick={()=>handleUserToggle(u)}>{u.is_active ? 'Desactivar' : 'Activar'}</button>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <button disabled={!usersPrev} onClick={()=>setUsersPage(p=>Math.max(1,p-1))} style={styles.btnSmall}>Anterior</button>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Página {usersPage} {usersCount > 0 && `de ${Math.ceil(usersCount/pageSize)}`}</div>
              <button disabled={!usersNext} onClick={()=>setUsersPage(p=>p+1)} style={styles.btnSmall}>Siguiente</button>
            </div>
          </div>

          <div style={{ ...styles.tableCard, marginTop: 12, overflowX: 'auto' }} className="card">
            <div style={styles.sectionHead}>
              <h2 style={{...styles.h3, fontSize: 17, color: '#1d3557'}}>Productos</h2>
              <input value={searchProduct} onChange={(e)=>setSearchProduct(e.target.value)} placeholder="Buscar producto..." style={styles.search} />
            </div>
            {fetching ? (
              <div style={styles.loading}>Cargando productos...</div>
            ) : products.length === 0 ? (
              <div style={styles.empty}>No hay productos</div>
            ) : (
              <ul style={styles.list}>
                {products.map(p => (
                  <li key={p.id} style={styles.listItem} className="row">
                    <div>
                      <div style={styles.itemTitle}>{p.name}</div>
                      <div style={styles.itemMeta}>{new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP'}).format(Number(p.price||0))}</div>
                    </div>
                    <span style={p.stock > 10 ? styles.badgeActive : (p.stock > 0 ? styles.badgeWarn : styles.badgeInactive)}>{p.stock ?? 0}</span>
                    <button style={{...styles.btnSmall, background:'#f1f5f9'}} onClick={()=>handleProductEdit(p)}>Editar</button>
                    <button style={{...styles.btnSmall, color:'#fff', background:'#ef4444'}} onClick={()=>handleProductDelete(p)}>Eliminar</button>
                    <button style={{...styles.btnSmall, background: p.active ? '#fef9c3' : '#dcfce7', color: '#1d3557'}} onClick={()=>handleProductToggle(p)}>{p.active ? 'Desactivar' : 'Activar'}</button>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <button disabled={!productsPrev} onClick={()=>setProductsPage(p=>Math.max(1,p-1))} style={styles.btnSmall}>Anterior</button>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Página {productsPage} {productsCount > 0 && `de ${Math.ceil(productsCount/pageSize)}`}</div>
              <button disabled={!productsNext} onClick={()=>setProductsPage(p=>p+1)} style={styles.btnSmall}>Siguiente</button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

const styles = {
  page: { padding: 20, maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' },
  header: { marginBottom: 12 },
  h2: { margin: 0, fontSize: 26 },
  subtitle: { marginTop: 6, color: '#6b7280' },
  errorBox: { padding: 12, background: '#fff1f2', color: '#b91c1c', borderRadius: 10, marginBottom: 12 },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 },
  statCard: { background: '#fff', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 12, padding: 16, textAlign: 'center', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 22, fontWeight: 800, marginTop: 6 },
  statLabel: { color: '#6b7280', fontWeight: 600, fontSize: 13 },

  grid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 12, alignItems: 'start' },
  section: {},
  aside: {},

  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  h3: { margin: 0, fontSize: 16, fontWeight: 900 },
  search: { padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' },

  tableCard: { background: '#fff', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 12, padding: 12, boxShadow: '0 6px 18px rgba(2,6,23,0.04)' },
  loading: { padding: 14, color: '#6b7280' },
  empty: { padding: 14, color: '#6b7280', textAlign: 'center', fontWeight: 600 },

  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
  th: { textAlign: 'left', fontSize: 12, color: '#6b7280', padding: '10px 8px', borderBottom: '1px solid #eef1f5' },
  tr: {},
  td: { padding: '10px 8px', borderBottom: '1px solid #f3f4f6', fontSize: 14 },
  code: { background: '#f3f4f6', padding: '2px 6px', borderRadius: 6, fontSize: 12 },
  btnSmall: { padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.12)', textDecoration: 'none', color: '#111827', fontWeight: 700 },

  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  listItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 10, borderRadius: 10 },
  itemTitle: { fontWeight: 800 },
  itemMeta: { fontSize: 13, color: '#6b7280' },

  badgeActive: { background: '#ecfdf5', color: '#065f46', padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 800 },
  badgeInactive: { background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 800 },
  badgeWarn: { background: '#fffbeb', color: '#92400e', padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 800 },
};

const mini = { loadingWrap: { padding: 18, textAlign: 'center' } };
