// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../components/Api";
import '../components/ui/Design.css';

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
        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
          <Link to="/catalog" className="btn btn-primary">Explorar Catálogo</Link>
          <Link to="/shop/create" className="btn">Crear tu tienda</Link>

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
        <h1 style={styles.title}>DomiPyme</h1>
        <p style={styles.subtitle}>Apoya negocios locales — descubre tiendas y productos cerca de ti.</p>
        <div style={{ marginTop: 12 }}>
          <Link to="/catalog" style={styles.primaryBtn}>Explorar tiendas</Link>
        </div>
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
  hero: { maxWidth: 1100, margin: '6px auto 18px', padding: 18, borderRadius: 12, background: '#fff', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' },
  title: { margin: 0, fontSize: 32 },
  subtitle: { marginTop: 6, color: '#6b7280' },
  primaryBtn: { marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#111827', color: '#fff', textDecoration: 'none', fontWeight: 700 },

  skelCard: { width: 220, height: 100, background: 'linear-gradient(90deg,#f3f4f6 0%, #efefef 50%, #f3f4f6 100%)', borderRadius: 8 },
  productSkel: { height: 220, background: 'linear-gradient(90deg,#f3f4f6 0%, #efefef 50%, #f3f4f6 100%)', borderRadius: 10 },

  shopCard: { display: 'block', padding: 12, borderRadius: 10, background: '#fff', textDecoration: 'none', color: '#111827', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' },
  productCard: { background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' },
  productImageWrap: { width: '100%', height: 140, background: '#f6f7f9', overflow: 'hidden' },
  productImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },

  errBox: { padding: 12, background: '#fff1f2', color: '#b91c1c', borderRadius: 8 }
};
