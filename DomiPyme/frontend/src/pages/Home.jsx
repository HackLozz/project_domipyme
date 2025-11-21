// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 8);
    return () => clearTimeout(t);
  }, []);

  // Mock featured shops (puedes reemplazar por fetch a /shops/ si quieres)
  const featured = [
    { id: 'vino', name: 'Vinos & Más', desc: 'Vinos nacionales e internacionales', img: null },
    { id: 'pan', name: 'Panadería La Casa', desc: 'Pan fresco todos los días', img: null },
    { id: 'frutas', name: 'Frutas Selectas', desc: 'Fruta fresca y jugosa', img: null },
  ];

  const onSearch = (e) => {
    e.preventDefault();
    // navegar a catálogo con query como parámetro
    nav(`/catalog?q=${encodeURIComponent(q)}`);
  };

  // placeholder SVG inline
  const heroPlaceholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'>
      <rect width='100%' height='100%' fill='#eef2ff'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9aa4c6' font-size='30'>DomiPyme</text>
    </svg>`
  );

  return (
    <div style={styles.page} className={mounted ? 'page-enter' : ''}>
      <style>{`
        .page-enter { animation: pageEnter 340ms ease both; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .hero-card { transition: transform 260ms cubic-bezier(.2,.9,.2,1), box-shadow 260ms ease; }
        .hero-card:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(2,6,23,0.08); }

        .btn-cta { transition: transform 160ms ease, box-shadow 160ms ease; }
        .btn-cta:active { transform: translateY(1px) scale(0.998); }

        .feature { transition: transform 220ms ease, box-shadow 220ms ease, opacity 220ms ease; }
        .feature:hover { transform: translateY(-6px); box-shadow: 0 10px 24px rgba(2,6,23,0.06); }

        .input-field { transition: box-shadow 160ms ease, transform 160ms ease; }
        .input-field:focus { outline: none; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(17,24,39,0.06); }
      `}</style>

      <header style={styles.header}>
        <div style={styles.brand}>
          <h1 style={{ margin: 0 }}>DomiPyme</h1>
          <p style={{ margin: '6px 0 0 0', color: '#6b7280' }}>Apoya comercios locales — compra fácil y seguro</p>
        </div>

        <nav style={styles.headerActions}>
          <Link to="/catalog" style={styles.navLink}>Explorar</Link>
          <Link to="/register" style={styles.cta}>Crear cuenta</Link>
          <Link to="/login" style={styles.ghost}>Iniciar sesión</Link>
        </nav>
      </header>

      <main style={styles.main}>
        <section style={{ ...styles.hero, ...(mounted ? {} : { opacity: 0 }) }} className="hero-card">
          <div style={styles.heroLeft}>
            <h2 style={{ margin: 0, fontSize: 28 }}>Descubre y compra en comercios cerca de ti</h2>
            <p style={{ marginTop: 8, color: '#475569' }}>
              Encuentra tiendas, productos y ofertas. Soporta negocios locales y recibe todo en la puerta de tu casa.
            </p>

            <form onSubmit={onSearch} style={styles.searchRow}>
              <input
                className="input-field"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar tiendas o productos..."
                style={styles.searchInput}
              />
              <button type="submit" className="btn-cta" style={styles.searchBtn}>Buscar</button>
            </form>

            <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
              <Link to="/catalog" className="btn-cta" style={styles.primaryBtn}>Ver catálogo</Link>
              <Link to="/shop/create" style={styles.secondaryBtn}>Crear tienda</Link>
            </div>
          </div>

          <div style={styles.heroRight}>
            <img src={heroPlaceholder} alt="DomiPyme" style={styles.heroImage} />
          </div>
        </section>

        <section style={styles.features}>
          <h3 style={{ margin: '0 0 10px 0' }}>Tiendas destacadas</h3>
          <div style={styles.featureGrid}>
            {featured.map((f, i) => (
              <article key={f.id} className="feature" style={{ ...styles.featureCard, transitionDelay: `${i * 90}ms` }}>
                <div style={styles.featureTop}>
                  <div style={styles.featureThumb}>{(f.img) ? <img src={f.img} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={styles.placeholderThumb}>Sin imagen</div>}</div>
                  <div>
                    <strong>{f.name}</strong>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{f.desc}</div>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <Link to={`/shop/${f.id}`} style={styles.smallLink}>Visitar tienda</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={styles.infoRow}>
          <div style={styles.infoCard}>
            <h4 style={{ margin: 0 }}>¿Eres vendedor?</h4>
            <p style={{ marginTop: 8, color: '#475569' }}>Crea tu tienda, sube productos y empieza a recibir pedidos hoy mismo.</p>
            <Link to="/shop/create" style={styles.secondaryBtn}>Comenzar</Link>
          </div>

          <div style={styles.infoCard}>
            <h4 style={{ margin: 0 }}>Soporte</h4>
            <p style={{ marginTop: 8, color: '#475569' }}>¿Tienes dudas? Contáctanos o revisa la documentación.</p>
            <Link to="/contact" style={styles.smallLink}>Contacto</Link>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ---------- estilos ---------- */
const styles = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', padding: 20 },
  header: { maxWidth: 1100, margin: '0 auto 18px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: {},
  headerActions: { display: 'flex', gap: 10, alignItems: 'center' },
  navLink: { textDecoration: 'none', color: '#0f172a', padding: '8px 10px', borderRadius: 8, fontWeight: 700 },
  cta: { padding: '8px 12px', background: '#111827', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700 },
  ghost: { padding: '8px 12px', textDecoration: 'none', color: '#111827', borderRadius: 10, border: '1px solid rgba(17,24,39,0.06)' },

  main: { maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 },

  hero: { display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'center', padding: 18, borderRadius: 12, background: '#fff', boxShadow: '0 6px 24px rgba(2,6,23,0.04)', border: '1px solid rgba(15,23,42,0.03)' },
  heroLeft: {},
  heroRight: { display: 'flex', justifyContent: 'center' },
  heroImage: { width: '100%', maxWidth: 420, borderRadius: 10, border: '1px solid rgba(0,0,0,0.04)' },

  searchRow: { marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' },
  searchInput: { padding: '10px 12px', borderRadius: 10, border: '1px solid #e6e9ef', minWidth: 240, flex: 1 },
  searchBtn: { padding: '10px 14px', background: '#111827', color: '#fff', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700 },

  primaryBtn: { padding: '10px 14px', background: '#111827', color: '#fff', borderRadius: 10, border: 'none', textDecoration: 'none', fontWeight: 700 },
  secondaryBtn: { padding: '10px 12px', background: 'transparent', color: '#111827', borderRadius: 10, border: '1px solid rgba(17,24,39,0.06)', textDecoration: 'none', fontWeight: 700 },

  features: { padding: 0 },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 8 },
  featureCard: { padding: 12, borderRadius: 10, background: '#fff', boxShadow: '0 6px 18px rgba(2,6,23,0.04)', border: '1px solid rgba(15,23,42,0.03)', minHeight: 100 },
  featureTop: { display: 'flex', gap: 12, alignItems: 'center' },
  featureThumb: { width: 72, height: 56, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' },
  placeholderThumb: { width: 72, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' },
  smallLink: { color: '#111827', textDecoration: 'none', fontWeight: 700 },

  infoRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 6 },
  infoCard: { padding: 14, borderRadius: 10, background: '#fff', boxShadow: '0 6px 18px rgba(2,6,23,0.04)', border: '1px solid rgba(15,23,42,0.03)' },
};
