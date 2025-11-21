// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../components/Api';

export default function Dashboard() {
  const nav = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // animación de entrada ligera
    const t = setTimeout(() => setMounted(true), 8);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadProfile = async () => {
      setLoadingProfile(true);
      setError(null);

      // intenta 1) endpoint /accounts/me/ 2) localStorage user (fallback)
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const res = await api.get('accounts/me/', { signal: controller.signal });
          if (!cancelled) setProfile(res.data);
        } else {
          // intentar obtener usuario desde localStorage (si tu app guarda info allí)
          const raw = localStorage.getItem('user');
          if (raw) {
            try {
              const u = JSON.parse(raw);
              if (!cancelled) setProfile(u);
            } catch {
              if (!cancelled) setProfile({ username: raw });
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('No se pudo cargar perfil:', err);
          setError(null); // silenciar en UI (no crítico)
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    nav('/login');
  };

  const username = profile?.full_name || profile?.name || profile?.username || (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      return u?.username || u?.name || null;
    } catch { return null; }
  })();

  return (
    <div style={styles.wrapper}>
      <style>{`
        .dash-enter { animation: dashEnter 320ms ease both; }
        @keyframes dashEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .btn-ghost { transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease; }
        .btn-ghost:active { transform: translateY(1px) scale(0.998); }

        .nav-grid { display:flex; gap:10px; flex-wrap:wrap; }
        .quick-card { transition: transform 220ms cubic-bezier(.2,.9,.2,1), box-shadow 220ms ease; }
        .quick-card:hover { transform: translateY(-6px); box-shadow: 0 10px 28px rgba(2,6,23,0.08); }
      `}</style>

      <main style={{ ...styles.container, ...(mounted ? {} : { opacity: 0 }) }} className="dash-enter">
        <section style={styles.card}>
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.h1}>Dashboard</h1>
              <p style={styles.subtitle}>
                Bienvenido{username ? `, ${username}` : ''} — esta es tu vista privada.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Link to="/shop/create" className="btn-ghost" style={styles.primarySmall}>
                + Crear tienda
              </Link>

              <button onClick={logout} style={styles.logout}>
                Cerrar sesión
              </button>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
            <div style={styles.row}>
              <div style={styles.leftBlock}>
                <h3 style={{ margin: 0 }}>Accesos rápidos</h3>
                <p style={{ margin: '6px 0 0 0', color: '#6b7280' }}>
                  Navega por las secciones más usadas.
                </p>

                <div style={{ marginTop: 12 }} className="nav-grid">
                  <Link to="/" style={styles.quickLink}>Ver Home público</Link>
                  <Link to="/catalog" style={styles.quickLink}>Catálogo</Link>
                  <Link to="/cart" style={styles.quickLink}>Carrito</Link>
                  <Link to="/orders" style={styles.quickLink}>Mis pedidos</Link>
                  <Link to="/shop" style={styles.quickLink}>Mis tiendas</Link>
                </div>
              </div>

              <div style={styles.rightBlock}>
                <div style={styles.infoCard} className="quick-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>Estado</div>
                      <div style={{ fontWeight: 800, fontSize: 18, marginTop: 6 }}>Activo</div>
                    </div>
                    <div style={styles.pulse} />
                  </div>

                  <div style={{ marginTop: 10, fontSize: 13, color: '#475569' }}>
                    {loadingProfile ? 'Cargando perfil...' : (profile ? 'Perfil cargado' : 'Perfil no disponible')}
                  </div>
                </div>

                <div style={{ height: 12 }} />

                <div style={styles.infoCard} className="quick-card">
                  <div style={{ fontSize: 13, color: '#6b7280' }}>Atajos</div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <button onClick={() => nav('/shop/create')} className="btn-ghost" style={styles.smallBtn}>Nueva tienda</button>
                    <button onClick={() => nav('/catalog')} className="btn-ghost" style={styles.smallBtn}>Explorar</button>
                    <button onClick={() => nav('/orders')} className="btn-ghost" style={styles.smallBtn}>Ver pedidos</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.analyticsRow}>
              <div style={styles.metricCard}>
                <div style={styles.metricTitle}>Tiendas</div>
                <div style={styles.metricValue}>—</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricTitle}>Pedidos</div>
                <div style={styles.metricValue}>—</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricTitle}>Ingresos</div>
                <div style={styles.metricValue}>—</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------- estilos ---------- */
const styles = {
  wrapper: { padding: 20, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', minHeight: '80vh', background: '#f8fafc' },
  container: { maxWidth: 1100, margin: '0 auto' },
  card: { padding: 20, borderRadius: 12, background: '#fff', boxShadow: '0 8px 24px rgba(2,6,23,0.06)', border: '1px solid rgba(15,23,42,0.03)' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  h1: { margin: 0, fontSize: 22 },
  subtitle: { margin: '6px 0 0 0', color: '#6b7280' },

  primarySmall: {
    padding: '8px 12px',
    background: '#111827',
    color: '#fff',
    borderRadius: 10,
    textDecoration: 'none',
    fontWeight: 700,
    display: 'inline-block'
  },

  logout: {
    padding: '8px 12px',
    borderRadius: 10,
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700
  },

  row: { display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 8, flexWrap: 'wrap' },
  leftBlock: { flex: 1, minWidth: 240 },
  rightBlock: { width: 320, minWidth: 260 },

  quickLink: {
    padding: '8px 12px',
    background: '#f1f5f9',
    borderRadius: 10,
    textDecoration: 'none',
    color: '#0f172a',
    fontWeight: 700,
    display: 'inline-block'
  },

  infoCard: {
    padding: 12,
    borderRadius: 10,
    background: '#fff',
    boxShadow: '0 6px 18px rgba(2,6,23,0.04)',
    border: '1px solid rgba(15,23,42,0.03)'
  },

  pulse: {
    width: 12,
    height: 12,
    borderRadius: 12,
    background: 'linear-gradient(90deg,#34d399,#10b981)',
    boxShadow: '0 6px 18px rgba(16,185,129,0.12)'
  },

  smallBtn: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(15,23,42,0.04)',
    background: 'transparent',
    cursor: 'pointer',
    fontWeight: 700
  },

  analyticsRow: { display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  metricCard: {
    padding: 14,
    borderRadius: 10,
    minWidth: 180,
    flex: 1,
    background: '#fff',
    boxShadow: '0 6px 18px rgba(2,6,23,0.04)',
    border: '1px solid rgba(15,23,42,0.03)'
  },
  metricTitle: { fontSize: 13, color: '#6b7280' },
  metricValue: { fontSize: 22, fontWeight: 800, marginTop: 8 }
};
