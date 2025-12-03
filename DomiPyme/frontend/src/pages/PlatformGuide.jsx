// src/pages/PlatformGuide.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function PlatformGuide() {
  const [mounted, setMounted] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),10); return ()=>clearTimeout(t); },[]);

  return (
    <div style={styles.container} className={mounted ? 'page-enter' : ''}>
      <style>{`
        .page-enter { animation: pageEnter 320ms ease both; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .card { transition: transform 160ms ease, box-shadow 160ms ease; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(2,6,23,0.10); }
      `}</style>

      <header style={styles.hero}>
        <div>
          <h1 style={styles.h1}>Cómo funciona DomiPyme</h1>
          <p style={styles.subtitle}>Una plataforma para conectar clientes con comercios locales. Descubre el flujo completo, roles, y funcionalidades.</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <Link to="/catalog" style={styles.btnPrimary}>Explorar tiendas</Link>
            <Link to="/register" style={styles.btnSecondary}>Crear cuenta</Link>
          </div>
        </div>
        <div style={styles.heroArt}>{heroSVG}</div>
      </header>

      <section style={styles.section}>
        <h2 style={styles.h2}>Roles y capacidades</h2>
        <div style={styles.grid3}>
          <div style={styles.card} className="card">
            <div style={styles.emoji}>🛒</div>
            <h3 style={styles.cardTitle}>Cliente</h3>
            <ul style={styles.list}>
              <li>Explora tiendas y productos</li>
              <li>Carrito, checkout y seguimiento</li>
              <li>Historial y detalle de órdenes</li>
              <li>Gestión de perfil</li>
            </ul>
          </div>
          <div style={styles.card} className="card">
            <div style={styles.emoji}>🛍️</div>
            <h3 style={styles.cardTitle}>Comerciante</h3>
            <ul style={styles.list}>
              <li>Crear y editar tienda</li>
              <li>Publicar y administrar productos</li>
              <li>Tablero: métricas y pedidos</li>
              <li>Enlace público a la tienda</li>
            </ul>
          </div>
          <div style={styles.card} className="card">
            <div style={styles.emoji}>🛡️</div>
            <h3 style={styles.cardTitle}>Admin</h3>
            <ul style={styles.list}>
              <li>Visión global de la plataforma</li>
              <li>Gestión de usuarios y tiendas</li>
              <li>Listado de productos</li>
              <li>Métricas clave</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Flujo general</h2>
        <div style={styles.flowWrap}>
          {flowSVG}
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, color: '#6b7280' }}>Desde el descubrimiento hasta el pedido completado</div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.h2}>Componentes principales</h2>
        <div style={styles.grid2}>
          <div style={styles.card} className="card">
            <h3 style={styles.cardTitle}>Catálogo y Tiendas</h3>
            <p style={styles.p}>Explora comercios locales, accede a su página pública y descubre sus productos destacados.</p>
            <img alt="catalogo" src={imgPlaceholder} style={styles.img} />
          </div>
          <div style={styles.card} className="card">
            <h3 style={styles.cardTitle}>Carrito y Checkout</h3>
            <p style={styles.p}>Agrega productos, ajusta cantidades y completa la compra con un proceso claro y rápido.</p>
            <img alt="checkout" src={imgPlaceholder} style={styles.img} />
          </div>
          <div style={styles.card} className="card">
            <h3 style={styles.cardTitle}>Panel del Comerciante</h3>
            <p style={styles.p}>Gestiona tu tienda: edita información, publica productos, y revisa pedidos y métricas.</p>
            <img alt="merchant" src={imgPlaceholder} style={styles.img} />
          </div>
          <div style={styles.card} className="card">
            <h3 style={styles.cardTitle}>Panel de Administración</h3>
            <p style={styles.p}>Supervisa la plataforma: usuarios, tiendas, productos y estadísticas globales.</p>
            <img alt="admin" src={imgPlaceholder} style={styles.img} />
          </div>
        </div>
      </section>

      <section style={{ ...styles.section, ...styles.cta }}>
        <div>
          <h2 style={{ ...styles.h2, margin: 0 }}>¿Eres comerciante?</h2>
          <p style={{ margin: '6px 0 12px', color: '#6b7280' }}>Crea tu tienda y empieza a vender hoy mismo.</p>
          <Link to="/register" style={styles.btnPrimary}>Crear cuenta</Link>
        </div>
        <div style={{ opacity: 0.9 }}>{shopSVG}</div>
      </section>
    </div>
  );
}

const imgPlaceholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-size="20">Imagen</text></svg>`);

const heroSVG = (
  <svg width="220" height="140" viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect width="220" height="140" rx="16" fill="#f3f4f6" />
    <circle cx="50" cy="50" r="20" fill="#111827"/>
    <rect x="80" y="36" width="110" height="12" rx="6" fill="#d1d5db"/>
    <rect x="80" y="56" width="70" height="12" rx="6" fill="#e5e7eb"/>
    <rect x="20" y="90" width="180" height="12" rx="6" fill="#e5e7eb"/>
  </svg>
);

const flowSVG = (
  <svg width="720" height="120" viewBox="0 0 720 120" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%' }}>
    <defs>
      <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L6,3 z" fill="#9ca3af" />
      </marker>
    </defs>
    <g fill="#f9fafb" stroke="#e5e7eb">
      <rect x="10" y="20" width="150" height="80" rx="10" />
      <rect x="190" y="20" width="150" height="80" rx="10" />
      <rect x="370" y="20" width="150" height="80" rx="10" />
      <rect x="550" y="20" width="150" height="80" rx="10" />
    </g>
    <g fill="#111827">
      <text x="85" y="68" textAnchor="middle">Explora</text>
      <text x="265" y="68" textAnchor="middle">Carrito</text>
      <text x="445" y="68" textAnchor="middle">Checkout</text>
      <text x="625" y="68" textAnchor="middle">Orden</text>
    </g>
    <g stroke="#9ca3af" strokeWidth="2" markerEnd="url(#arrow)">
      <line x1="160" y1="60" x2="190" y2="60" />
      <line x1="340" y1="60" x2="370" y2="60" />
      <line x1="520" y1="60" x2="550" y2="60" />
    </g>
  </svg>
);

const shopSVG = (
  <svg width="200" height="120" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="40" width="160" height="60" rx="8" fill="#f3f4f6" stroke="#e5e7eb"/>
    <rect x="30" y="20" width="140" height="30" rx="6" fill="#111827" />
    <rect x="30" y="70" width="40" height="30" rx="4" fill="#e5e7eb" />
    <rect x="80" y="70" width="40" height="30" rx="4" fill="#e5e7eb" />
    <rect x="130" y="70" width="40" height="30" rx="4" fill="#e5e7eb" />
  </svg>
);

const styles = {
  container: { padding: 20, maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' },
  hero: { display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16, alignItems: 'center', background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 10px 30px rgba(2,6,23,0.06)', border: '1px solid rgba(15,23,42,0.03)', marginBottom: 16 },
  h1: { margin: 0, fontSize: 28, fontWeight: 900 },
  subtitle: { marginTop: 6, color: '#6b7280' },
  btnPrimary: { padding: '10px 16px', borderRadius: 10, background: '#111827', color: '#fff', textDecoration: 'none', fontWeight: 800, display: 'inline-block' },
  btnSecondary: { padding: '10px 16px', borderRadius: 10, background: 'transparent', color: '#111827', textDecoration: 'none', fontWeight: 800, border: '1px solid rgba(17,24,39,0.12)' },

  section: { marginTop: 18 },
  h2: { margin: 0, fontSize: 22, fontWeight: 900 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 },
  card: { background: '#fff', borderRadius: 12, padding: 16, border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' },
  cardTitle: { margin: '6px 0 8px', fontSize: 16, fontWeight: 900 },
  emoji: { fontSize: 32 },
  list: { margin: 0, paddingLeft: 18, color: '#374151' },
  p: { margin: 0, color: '#374151' },
  img: { width: '100%', height: 160, objectFit: 'cover', background: '#f3f4f6', borderRadius: 8, border: '1px solid #eef2f7' },

  flowWrap: { background: '#fff', borderRadius: 12, padding: 16, border: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'center', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' },

  cta: { display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16, alignItems: 'center', background: '#111827', color: '#fff', padding: 20, borderRadius: 12, marginTop: 18 },
};
