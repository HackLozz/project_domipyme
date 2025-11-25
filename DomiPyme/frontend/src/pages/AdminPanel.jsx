// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import api from '../components/Api';
import { useAuth } from '../context/AuthProvider';
import { Navigate } from 'react-router-dom';

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [fetching, setFetching] = useState(true); // solo para UI local (no afecta lógica de permisos)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 8);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      setError(null);
      try {
        const [s, u, p] = await Promise.all([
          api.get('shops/'),
          api.get('users/'),
          api.get('products/'),
        ]);
        setShops(s.data.results || s.data || []);
        setUsers(u.data.results || u.data || []);
        setProducts(p.data.results || p.data || []);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar datos administrativos.');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  // mantener la verificación original: si auth.loading mostrar "Cargando..." (sin alterar)
  if (loading) return <div style={miniStyles.loadingWrap}>Cargando...</div>;
  if (!user || !user.is_staff) return <Navigate to="/" replace />;

  return (
    <div style={styles.page} className={mounted ? 'page-enter' : ''}>
      <style>{`
        .page-enter { animation: pageEnter 320ms ease both; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .card-enter { animation: cardEnter 360ms cubic-bezier(.2,.9,.2,1) both; }
        @keyframes cardEnter { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }

        .skeleton { background: linear-gradient(90deg,#f3f4f6 0%, #efefef 50%, #f3f4f6 100%); background-size: 200% 100%; animation: shimmer 1200ms linear infinite; border-radius: 6px; }
        @keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
      `}</style>

      <header style={styles.header}>
        <div>
          <h2 style={styles.h2}>Panel administrativo</h2>
          <p style={styles.description}>Acceso restringido — gestión de tiendas, productos y usuarios.</p>
        </div>
      </header>

      <main style={styles.grid}>
        <section style={styles.left}>
          <div style={{ ...styles.card, ...styles.cardHeader }} className="card-enter">
            <h3 style={styles.cardTitle}>Resumen</h3>
            <div style={styles.statsRow}>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Tiendas</div>
                <div style={styles.statValue}>{fetching ? <span style={miniStyles.skelValue}></span> : shops.length}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Usuarios</div>
                <div style={styles.statValue}>{fetching ? <span style={miniStyles.skelValue}></span> : users.length}</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Productos</div>
                <div style={styles.statValue}>{fetching ? <span style={miniStyles.skelValue}></span> : products.length}</div>
              </div>
            </div>
          </div>

          <div style={{ ...styles.card, marginTop: 12 }} className="card-enter">
            <h3 style={styles.cardTitle}>Shops</h3>
            {error && <div style={styles.errorBox}>{error}</div>}

            {fetching ? (
              <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 56, height: 44 }} className="skeleton" />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 12, width: '40%' }} className="skeleton" />
                      <div style={{ height: 10, width: '60%', marginTop: 8 }} className="skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul style={styles.list}>
                {shops.map((s) => (
                  <li key={s.id} style={styles.listItem}>
                    <div>
                      <div style={styles.itemTitle}>{s.name}</div>
                      <div style={styles.itemMeta}>owner: {s.owner_email || s.owner || '—'}</div>
                    </div>
                    <div style={styles.itemActions}>
                      <button style={styles.smallBtn} onClick={() => window.open(`/shop/${s.slug ?? s.id}`, '_blank')}>Abrir</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside style={styles.right}>
          <div style={{ ...styles.card }} className="card-enter">
            <h3 style={styles.cardTitle}>Usuarios</h3>
            {fetching ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 12, width: '60%' }} className="skeleton" />
                    </div>
                    <div style={{ width: 48 }} className="skeleton" />
                  </div>
                ))}
              </div>
            ) : (
              <ul style={styles.list}>
                {users.map((u) => (
                  <li key={u.id} style={styles.listItem}>
                    <div>
                      <div style={styles.itemTitle}>{u.email}</div>
                      <div style={styles.itemMeta}>staff: {u.is_staff ? 'Yes' : 'No'}</div>
                    </div>
                    <div style={styles.itemActions}>
                      <button style={styles.smallBtn} onClick={() => alert(JSON.stringify(u, null, 2))}>Ver</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ ...styles.card, marginTop: 12 }} className="card-enter">
            <h3 style={styles.cardTitle}>Productos</h3>
            {fetching ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ width: 12, height: 12 }} className="skeleton" />
                    <div style={{ height: 12, width: '70%' }} className="skeleton" />
                  </div>
                ))}
              </div>
            ) : (
              <ul style={styles.list}>
                {products.map((p) => (
                  <li key={p.id} style={styles.listItem}>
                    <div>
                      <div style={styles.itemTitle}>{p.name}</div>
                      <div style={styles.itemMeta}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(p.price || 0))}</div>
                    </div>
                    <div style={styles.itemActions}>
                      <button style={styles.smallBtn} onClick={() => alert(JSON.stringify(p, null, 2))}>Ver</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

/* ---------- estilos ---------- */
const styles = {
  page: { padding: 20, maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' },
  header: { marginBottom: 12 },
  h2: { margin: 0 },
  description: { marginTop: 6, color: '#6b7280' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' },
  left: {},
  right: {},
  card: { padding: 14, borderRadius: 10, background: '#fff', boxShadow: '0 6px 18px rgba(2,6,23,0.04)', border: '1px solid rgba(15,23,42,0.03)' },
  cardHeader: { display: 'flex', flexDirection: 'column', gap: 8 },
  cardTitle: { margin: 0, fontSize: 16 },
  statsRow: { display: 'flex', gap: 12, marginTop: 8 },
  stat: { padding: 10, borderRadius: 8, background: '#f8fafc', minWidth: 84, textAlign: 'center' },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statValue: { fontSize: 18, fontWeight: 800, marginTop: 6 },

  list: { listStyle: 'none', padding: 0, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: 10 },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 8, background: '#fff' },
  itemTitle: { fontWeight: 700 },
  itemMeta: { fontSize: 13, color: '#6b7280' },
  itemActions: { display: 'flex', gap: 8, alignItems: 'center' },

  smallBtn: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(15,23,42,0.06)',
    background: 'transparent',
    cursor: 'pointer',
    fontWeight: 700
  },

  errorBox: { padding: 10, borderRadius: 8, background: '#fff1f2', color: '#b91c1c', marginTop: 8 },

};

/* mini styles for skeleton placeholders */
const miniStyles = {
  loadingWrap: { padding: 18, textAlign: 'center' },
  skelValue: { display: 'inline-block', width: 36, height: 18, borderRadius: 6, background: '#f3f4f6' }
};
