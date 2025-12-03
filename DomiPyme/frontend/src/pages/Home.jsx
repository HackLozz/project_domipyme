// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../components/Api";

export default function Home() {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    const normalizeSuccess = (res) => {
      if (!res) return [];
      // respuesta axios con data
      const data = res.data;
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (data.results && Array.isArray(data.results)) return data.results;
      // fallback: puede venir paginado con data.data o items
      if (data.data && Array.isArray(data.data)) return data.data;
      if (data.items && Array.isArray(data.items)) return data.items;
      return [];
    };

    const normalizeSettled = (settled) => {
      if (!settled) return [];
      if (settled.status === "fulfilled") {
        return normalizeSuccess(settled.value);
      } else {
        // rechazado: si fue 401/403 tratamos como vacío silencioso
        const err = settled.reason;
        const st = err?.response?.status;
        if (st === 401 || st === 403) {
          // token inválido o no autorizado: no mostramos error al usuario, solo fallback vacío
          console.warn("Recurso protegido: no autorizado (401/403). Mostrando fallback vacío.");
          return [];
        }
        // otros errores: log leve y fallback vacío
        console.warn("Error al cargar recurso público:", err?.message || err);
        return [];
      }
    };

    const load = async () => {
      try {
        const [sSettled, pSettled] = await Promise.allSettled([
          api.get("shops/"),
          api.get("products/?limit=8"),
        ]);

        if (!mounted) return;

        const shopsData = normalizeSettled(sSettled);
        const productsData = normalizeSettled(pSettled);

        setShops(shopsData);
        setProducts(productsData);
      } catch (e) {
        // Esto sería un fallo inesperado (no las promesas individuales)
        console.error("Home load unexpected error:", e);
        if (mounted) setErr("No se pudo cargar la información. Intenta recargar.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.hero}>
          <h1 style={styles.title}>DomiPyme</h1>
          <p style={styles.subtitle}>Apoya negocios locales — descubre tiendas y productos cerca de ti.</p>
        </div>

        <section style={{ maxWidth: 1100, margin: "18px auto" }}>
          <h3>Tiendas destacadas</h3>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={styles.skelCard} />
            ))}
          </div>

          <h3 style={{ marginTop: 20 }}>Productos</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={styles.productSkel} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.container}>
        <div style={styles.errBox}>{err}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <h1 style={styles.title}>DomiPyme</h1>
          <p style={styles.subtitle}>Apoya negocios locales — descubre tiendas y productos cerca de ti.</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <Link to="/catalog" style={styles.primaryBtn}>Explorar tiendas</Link>
            <Link to="/about" style={styles.secondaryBtn}>Cómo funciona</Link>
          </div>
        </div>
        <div style={{ width: 220 }}>{heroMiniSVG}</div>
      </div>

      <section style={{ maxWidth: 1100, margin: "18px auto" }}>
        <h3>Tiendas destacadas</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginTop: 12 }}>
          {shops && shops.length > 0 ? (
            shops.slice(0, 8).map((s) => (
              <Link key={s.id} to={`/shop/${encodeURIComponent(s.slug || s.id)}`} style={styles.shopCard}>
                <div style={{ fontWeight: 800 }}>{s.name}</div>
                <div style={{ color: "#6b7280", fontSize: 13 }}>{s.description}</div>
              </Link>
            ))
          ) : (
            <div style={{ color: "#6b7280" }}>No hay tiendas disponibles.</div>
          )}
        </div>

        <h3 style={{ marginTop: 20 }}>Productos recientes</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
          {products && products.length > 0 ? (
            products.map((p) => (
              <div key={p.id || p.pk || Math.random()} style={styles.productCard}>
                <div style={styles.productImageWrap}>
                  <img
                    src={p.image || p.photo || placeholderSVG}
                    alt={p.name}
                    style={styles.productImage}
                    onError={(e) => (e.currentTarget.src = placeholderSVG)}
                  />
                </div>
                <div style={{ padding: 10 }}>
                  <div style={{ fontWeight: 700 }}>{p.name || p.title}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{String(p.description || "").slice(0, 60)}</div>
                  <div style={{ marginTop: 8, fontWeight: 800 }}>
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(p.price || 0))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#6b7280" }}>No hay productos.</div>
          )}
        </div>
      </section>

      {/* Cómo funciona */}
      <section style={{ maxWidth: 1100, margin: '22px auto' }}>
        <h3>Cómo funciona</h3>
        <div style={styles.stepsGrid}>
          <div style={styles.stepCard}>
            <div style={styles.stepIcon}>🔎</div>
            <div>
              <div style={styles.stepTitle}>Explora</div>
              <div style={styles.stepText}>Encuentra tiendas y productos cerca de ti.</div>
            </div>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepIcon}>🧺</div>
            <div>
              <div style={styles.stepTitle}>Agrega al carrito</div>
              <div style={styles.stepText}>Ajusta cantidades y compara opciones.</div>
            </div>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepIcon}>💳</div>
            <div>
              <div style={styles.stepTitle}>Checkout</div>
              <div style={styles.stepText}>Completa tu compra de forma segura.</div>
            </div>
          </div>
          <div style={styles.stepCard}>
            <div style={styles.stepIcon}>📦</div>
            <div>
              <div style={styles.stepTitle}>Recibe tu pedido</div>
              <div style={styles.stepText}>Sigue el estado y disfruta tu compra.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Comerciantes */}
      <section style={styles.merchantCta}>
        <div>
          <h3 style={{ margin: 0 }}>¿Tienes un negocio?</h3>
          <p style={{ margin: '6px 0 12px', color: '#e5e7eb' }}>Crea tu tienda, publica productos y empieza a vender hoy.</p>
          <Link to="/register" style={styles.ctaBtn}>Crear cuenta</Link>
        </div>
        <div>{shopMiniSVG}</div>
      </section>
    </div>
  );
}

/* placeholder SVG inline para reutilizar */
const placeholderSVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='20'>Sin imagen</text></svg>`
);

/* estilos locales */
const styles = {
  container: { padding: 20, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' },
  hero: { maxWidth: 1100, margin: '6px auto 18px', padding: 18, borderRadius: 12, background: '#fff', boxShadow: '0 6px 18px rgba(2,6,23,0.04)', display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16, alignItems: 'center' },
  title: { margin: 0, fontSize: 32 },
  subtitle: { marginTop: 6, color: '#6b7280' },
  primaryBtn: { marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#111827', color: '#fff', textDecoration: 'none', fontWeight: 700 },
  secondaryBtn: { marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(17,24,39,0.12)', color: '#111827', textDecoration: 'none', fontWeight: 700 },

  skelCard: { width: 220, height: 100, background: 'linear-gradient(90deg,#f3f4f6 0%, #efefef 50%, #f3f4f6 100%)', borderRadius: 8 },
  productSkel: { height: 220, background: 'linear-gradient(90deg,#f3f4f6 0%, #efefef 50%, #f3f4f6 100%)', borderRadius: 10 },

  shopCard: { display: 'block', padding: 12, borderRadius: 10, background: '#fff', textDecoration: 'none', color: '#111827', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' },
  productCard: { background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' },
  productImageWrap: { width: '100%', height: 140, background: '#f6f7f9', overflow: 'hidden' },
  productImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },

  errBox: { padding: 12, background: '#fff1f2', color: '#b91c1c', borderRadius: 8 }
};

const heroMiniSVG = (
  <svg width="220" height="120" viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">
    <rect width="220" height="120" rx="12" fill="#f3f4f6" />
    <circle cx="48" cy="48" r="18" fill="#111827"/>
    <rect x="80" y="36" width="110" height="10" rx="5" fill="#d1d5db"/>
    <rect x="80" y="52" width="90" height="10" rx="5" fill="#e5e7eb"/>
    <rect x="20" y="84" width="180" height="10" rx="5" fill="#e5e7eb"/>
  </svg>
);

const shopMiniSVG = (
  <svg width="180" height="100" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="40" width="160" height="60" rx="8" fill="#f3f4f6" stroke="#e5e7eb"/>
    <rect x="30" y="20" width="140" height="30" rx="6" fill="#fff" stroke="#e5e7eb"/>
    <rect x="30" y="70" width="40" height="30" rx="4" fill="#e5e7eb" />
    <rect x="80" y="70" width="40" height="30" rx="4" fill="#e5e7eb" />
    <rect x="130" y="70" width="40" height="30" rx="4" fill="#e5e7eb" />
  </svg>
);

styles.stepsGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 };
styles.stepCard = { background: '#fff', borderRadius: 12, padding: 12, border: '1px solid rgba(15,23,42,0.06)', display: 'flex', gap: 10, alignItems: 'center', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' };
styles.stepIcon = { fontSize: 24 };
styles.stepTitle = { fontWeight: 800 };
styles.stepText = { color: '#6b7280', fontSize: 13 };
styles.merchantCta = { maxWidth: 1100, margin: '20px auto', background: '#111827', color: '#fff', padding: 18, borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 180px', gap: 16, alignItems: 'center' };
styles.ctaBtn = { padding: '8px 12px', borderRadius: 8, background: '#fff', color: '#111827', textDecoration: 'none', fontWeight: 800 };
