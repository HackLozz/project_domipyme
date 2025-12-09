// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../components/Api";
import "./Home.css";

/**
 * Home Component
 * Página principal con tiendas destacadas, productos recientes y CTA
 * @component
 */
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
      <div className="home">
        <div className="home__hero">
          <div className="home__hero-content">
            <h1>DomiPyme</h1>
            <p>Apoya negocios locales — descubre tiendas y productos cerca de ti.</p>
          </div>
        </div>

        <section className="home__section">
          <h3>Tiendas destacadas</h3>
          <div className="home__skeleton-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="home__skeleton-card" />
            ))}
          </div>

          <h3 style={{ marginTop: 32 }}>Productos</h3>
          <div className="home__skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="home__skeleton-card" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (err) {
    return (
      <div className="home">
        <div className="home__error">{err}</div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section */}
      <div className="home__hero">
        <div className="home__hero-content">
          <h1>DomiPyme</h1>
          <p>Apoya negocios locales — descubre tiendas y productos cerca de ti.</p>
          <div className="home__hero-actions">
            <Link to="/catalog" className="home__btn-primary">Explorar tiendas</Link>
            <Link to="/about" className="home__btn-secondary">Cómo funciona</Link>
          </div>
        </div>
        <div className="home__hero-visual">{heroMiniSVG}</div>
      </div>

      {/* Featured Shops */}
      <section className="home__section">
        <h3>Tiendas destacadas</h3>
        <div className="home__shops-grid">
          {shops && shops.length > 0 ? (
            shops.slice(0, 8).map((s) => (
              <Link key={s.id} to={`/shop/${encodeURIComponent(s.slug || s.id)}`} className="home__shop-card">
                <div className="home__shop-name">{s.name}</div>
                <div className="home__shop-description">{s.description}</div>
              </Link>
            ))
          ) : (
            <div className="home__empty">No hay tiendas disponibles.</div>
          )}
        </div>

        {/* Recent Products */}
        <h3 style={{ marginTop: 32 }}>Productos recientes</h3>
        <div className="home__products-grid">
          {products && products.length > 0 ? (
            products.map((p) => (
              <div key={p.id || p.pk || Math.random()} className="home__product-card">
                <div className="home__product-image-wrap">
                  <img
                    src={p.image || p.photo || placeholderSVG}
                    alt={p.name}
                    className="home__product-image"
                    onError={(e) => (e.currentTarget.src = placeholderSVG)}
                  />
                </div>
                <div className="home__product-content">
                  <div className="home__product-name">{p.name || p.title}</div>
                  <div className="home__product-description">
                    {String(p.description || "").slice(0, 60)}{p.description?.length > 60 ? '...' : ''}
                  </div>
                  <div className="home__product-price">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(p.price || 0))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="home__empty">No hay productos disponibles.</div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="home__section">
        <h3>Cómo funciona</h3>
        <div className="home__steps-grid">
          <div className="home__step-card">
            <div className="home__step-icon">🔎</div>
            <div>
              <div className="home__step-title">Explora</div>
              <div className="home__step-text">Encuentra tiendas y productos cerca de ti.</div>
            </div>
          </div>
          <div className="home__step-card">
            <div className="home__step-icon">🧺</div>
            <div>
              <div className="home__step-title">Agrega al carrito</div>
              <div className="home__step-text">Ajusta cantidades y compara opciones.</div>
            </div>
          </div>
          <div className="home__step-card">
            <div className="home__step-icon">💳</div>
            <div>
              <div className="home__step-title">Checkout</div>
              <div className="home__step-text">Completa tu compra de forma segura.</div>
            </div>
          </div>
          <div className="home__step-card">
            <div className="home__step-icon">📦</div>
            <div>
              <div className="home__step-title">Recibe tu pedido</div>
              <div className="home__step-text">Sigue el estado y disfruta tu compra.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Merchant CTA */}
      <section className="home__merchant-cta">
        <div>
          <h3>¿Tienes un negocio?</h3>
          <p>Crea tu tienda, publica productos y empieza a vender hoy.</p>
          <Link to="/register" className="home__cta-btn">Crear cuenta</Link>
        </div>
        <div className="home__cta-visual">{shopMiniSVG}</div>
      </section>
    </div>
  );
}

/* placeholder SVG inline para reutilizar */
const placeholderSVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='20'>Sin imagen</text></svg>`
);

/* SVG Illustrations */
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
