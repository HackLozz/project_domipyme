// src/pages/ShopPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../components/Api';
import axios from 'axios'; // para isCancel
import './ShopPage.css';

const ANIM_MS = 300;

const firstDefined = (...vals) => {
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
};

export default function ShopPage() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [adding, setAdding] = useState({});
  const mountedRef = useRef(true);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    const isCanceled = (err) =>
      !err
        ? false
        : err?.name === 'CanceledError' ||
          err?.name === 'AbortError' ||
          err?.code === 'ERR_CANCELED' ||
          (axios && axios.isCancel && axios.isCancel(err));

    const normalizeShopFromResponse = (raw) => {
      // raw puede ser objeto, {results: [...]}, array, {data: {...}} etc.
      if (!raw) return null;
      if (Array.isArray(raw)) {
        // buscar primer que coincida con slug (si disponible)
        return raw.length > 0 ? raw[0] : null;
      }
      if (raw.results && Array.isArray(raw.results)) {
        // list response -> tomar primer elemento o el objeto entero si solo uno
        if (raw.results.length === 1) return raw.results[0];
        // si viene una lista (multiples shops) intentar buscar por slug
        if (slug) {
          const found = raw.results.find((s) => String(firstDefined(s.slug, s.id, s.pk)).toLowerCase() === String(slug).toLowerCase());
          return found || null;
        }
        return raw.results[0] || null;
      }
      if (raw.data) return normalizeShopFromResponse(raw.data);
      // si es objeto directo
      return raw;
    };

    const normalizeProductsFromResponse = (raw) => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (raw.results && Array.isArray(raw.results)) return raw.results;
      if (raw.items && Array.isArray(raw.items)) return raw.items;
      if (raw.products && Array.isArray(raw.products)) return raw.products;
      if (raw.data) return normalizeProductsFromResponse(raw.data);
      // fallback: si raw es objeto con keys numericas -> transformar
      return [];
    };

    const load = async () => {
    setLoading(true);
    setError(null);
    setShop(null);
    setProducts([]);
    try {
      // Intentamos traer shop por slug
      let shopResp;
      try {
        shopResp = await api.get(`shops/slug/${encodeURIComponent(slug)}/`, {
          signal: controller.signal,
        });
      } catch (errSlug) {
        // Si fue 404 => intentamos fallback de búsqueda por name/slug en listado
        const status = errSlug?.response?.status;
        if (status === 404) {
          console.warn('Shop detail returned 404, intentando fallback por listado (search).', errSlug?.response?.data);
          // Intentamos buscar por slug/name en list endpoint
          const listResp = await api.get(`shops/?search=${encodeURIComponent(slug)}`, { signal: controller.signal });
          const candidate = normalizeShopFromResponse(listResp?.data);
          if (candidate) {
            if (!mountedRef.current) return;
            setShop(candidate);
          } else {
            // No se encontró en listado
            throw errSlug; // se propaga al catch externo para manejar mensaje de error
          }
          // luego seguimos a cargar productos usando candidate
        } else {
          // No es 404 -> propagar error al outer catch
          throw errSlug;
        }
      }
    
      // Si shopResp existe (200), procesarla
      let shopData = null;
      if (shopResp && shopResp.data) {
        shopData = normalizeShopFromResponse(shopResp.data);
        if (!shopData) {
          // Si no se pudo normalizar el response, intentar fallback list
          const listResp = await api.get(`shops/?search=${encodeURIComponent(slug)}`, { signal: controller.signal });
          const candidate = normalizeShopFromResponse(listResp?.data);
          if (candidate) {
            if (!mountedRef.current) return;
            setShop(candidate);
          } else {
            throw new Error('Tienda no encontrada por slug ni en listado.');
          }
        } else {
          if (!mountedRef.current) return;
          setShop(shopData);
        }
      }
    
      // Determinar shop id para productos:
      const resolved = shopData || (/* if setShop was from candidate fallback above, read from state */ (mountedRef.current && (document ? null : null)));
      // Simpler: get current shop from state (prefer state if set), else use shopData
      const currentShop = shopData || (mountedRef.current ? (shop || null) : null);
      const shopId = String(firstDefined(currentShop?.id, currentShop?.pk, currentShop?._id, currentShop?.shop_id, null));
      if (!shopId) {
        // no hay shop id => no cargamos productos
        setProducts([]);
        return;
      }
    
      const prodResp = await api.get(`products/?shop=${encodeURIComponent(shopId)}`, {
        signal: controller.signal,
      });
      const resolvedProducts = normalizeProductsFromResponse(prodResp?.data);
      if (!mountedRef.current) return;
      setProducts(resolvedProducts);
    } catch (e) {
      if (isCanceled(e)) {
        return;
      }
      console.error('Shop load error', e);
      const serverMessage = e?.response?.data?.detail || e?.response?.data || e?.message;
      setError(typeof serverMessage === 'string' ? serverMessage : 'No se pudo cargar la tienda. Intenta recargar.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };
  


    if (slug) load();
    else {
      setLoading(false);
      setError('Slug inválido.');
    }

    return () => {
      mountedRef.current = false;
      controller.abort();
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [slug]);

  const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='20'>Sin imagen</text></svg>`
  );

  const makeUid = (prefix = '') => `${Date.now()}_${Math.random().toString(36).slice(2,8)}_${prefix}`;

  const addToCart = (product) => {
    if (!product) return;
    const productId = String(firstDefined(product.id, product.pk, product._id, '') || makeUid('nop'));
    const key = productId;
    setAdding((s) => ({ ...s, [key]: true }));

    let raw = [];
    try {
      raw = JSON.parse(localStorage.getItem('dp_cart') || '[]');
      if (!Array.isArray(raw)) raw = [];
    } catch (err) {
      raw = [];
    }

    const shopId = String(firstDefined(shop?.id, shop?.pk, shop?._id, '')) || null;
    const existingIndex = raw.findIndex(
      (it) => String(it.product_id) === productId && String(it.shop_id) === shopId
    );

    if (existingIndex >= 0) {
      raw[existingIndex].qty = (Number(raw[existingIndex].qty) || 1) + 1;
      raw[existingIndex].price = Number(firstDefined(product.price, product.unit_price, product.amount, raw[existingIndex].price || 0));
      raw[existingIndex].name = firstDefined(product.name, product.title, raw[existingIndex].name);
      raw[existingIndex].image = firstDefined(product.image, product.photo, raw[existingIndex].image);
    } else {
      const item = {
        uid: makeUid(`p${productId}`),
        product_id: productId,
        shop_id: shopId,
        name: firstDefined(product.name, product.title, 'Producto'),
        price: Number(firstDefined(product.price, product.unit_price, product.amount, 0)),
        qty: 1,
        image: firstDefined(product.image, product.photo, null),
        raw: product,
      };
      raw.unshift(item);
    }

    try {
      localStorage.setItem('dp_cart', JSON.stringify(raw));
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }

    setToast(`${firstDefined(product.name, product.title, 'Producto')} añadido al carrito`);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 1600);

    setTimeout(() => {
      setAdding((s) => {
        const copy = { ...s };
        delete copy[key];
        return copy;
      });
    }, ANIM_MS + 120);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.headerSkeleton}>
          <div style={styles.skelTitle} />
          <div style={styles.skelSubtitle} />
        </div>

        <div style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={styles.card}>
              <div style={{ height: 120 }} className="skeleton" />
              <div style={{ padding: 12 }}>
                <div style={{ height: 14, width: '70%' }} className="skeleton" />
                <div style={{ height: 12, width: '40%', marginTop: 8 }} className="skeleton" />
                <div style={{ height: 34, width: '100%', marginTop: 12 }} className="skeleton" />
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .skeleton { background: linear-gradient(90deg,#f3f4f6 0%, #efefef 50%, #f3f4f6 100%); background-size: 200% 100%; animation: shimmer 1200ms linear infinite; border-radius: 6px; }
          @keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errBox}>
          <div>{error}</div>
          <div style={{ marginTop: 10 }}>
            <button onClick={() => window.location.reload()} style={styles.reloadBtn}>Reintentar</button>
            <Link to="/catalog" style={styles.linkBtn}>Volver al catálogo</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return <div style={{ padding: 20 }}>Tienda no encontrada.</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.shopTitle}>{shop.name}</h2>
          {shop.city && <div style={styles.shopMeta}>{shop.city} {shop.address ? `• ${shop.address}` : ''}</div>}
          {shop.description && <p style={styles.shopDesc}>{shop.description}</p>}
        </div>

        <div style={styles.headerActions}>
          <Link to="/catalog" style={styles.linkBtn}>Volver al catálogo</Link>
          <Link to={`/shop/${firstDefined(shop.slug, shop.id)}`} style={styles.primaryBtn}>Ver tienda</Link>
        </div>
      </header>

      <main>
        <h3 style={{ marginTop: 8 }}>Productos</h3>
        {products.length === 0 ? (
          <div style={styles.empty}>No hay productos disponibles.</div>
        ) : (
          <ul style={styles.grid}>
            {products.map((p, idx) => {
              const key = String(firstDefined(p.id, p.pk, idx));
              const isAdding = Boolean(adding[key]);
              return (
                <li key={key} style={{ ...styles.card, ...(isAdding ? styles.cardAdding : {}) }} className="product-card">
                  <div style={styles.imageWrap}>
                    <img
                      src={firstDefined(p.image, p.photo, placeholder)}
                      alt={p.name || p.title || 'Producto'}
                      style={styles.image}
                      onError={(e) => (e.currentTarget.src = placeholder)}
                    />
                  </div>

                  <div style={styles.cardBody}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                      <div>
                        <div style={styles.prodName}>{p.name || p.title}</div>
                        {p.description && <div style={styles.prodDesc}>{String(p.description).slice(0, 80)}</div>}
                      </div>

                      <div style={{ fontWeight: 800 }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(firstDefined(p.price, 0)))}</div>
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        onClick={() => addToCart(p)}
                        style={isAdding ? styles.addingBtn : styles.addBtn}
                        aria-label={`Agregar ${p.name} al carrito`}
                      >
                        {isAdding ? 'Añadido' : 'Agregar'}
                      </button>

                      <Link to={`/product/${firstDefined(p.id, p.pk)}`} style={styles.viewBtn}>Ver</Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {toast && <div style={styles.toast}>{toast}</div>}

      <style>{`
        .product-card { transition: transform ${ANIM_MS}ms ease, box-shadow ${ANIM_MS}ms ease; }
        .product-card:hover { transform: translateY(-6px); box-shadow: 0 10px 26px rgba(2,6,23,0.06); }
      `}</style>
    </div>
  );
}

/* ---------- estilos (sin cambios funcionales) ---------- */
const styles = {
  container: { padding: 20, maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  shopTitle: { margin: 0 },
  shopMeta: { color: '#6b7280', fontSize: 13 },
  shopDesc: { marginTop: 8, color: '#475569' },
  headerActions: { display: 'flex', gap: 8, alignItems: 'center' },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 16,
    listStyle: 'none',
    padding: 0,
    margin: '12px 0'
  },
  card: {
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 6px 18px rgba(2,6,23,0.04)',
    overflow: 'hidden',
    border: '1px solid rgba(15,23,42,0.03)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 220,
  },
  cardAdding: { transform: 'scale(0.995)', boxShadow: '0 8px 28px rgba(2,6,23,0.08)' },
  imageWrap: { width: '100%', height: 140, overflow: 'hidden', background: '#f6f7f9' },
  image: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  cardBody: { padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 },
  prodName: { fontWeight: 800 },
  prodDesc: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  addBtn: {
    padding: '8px 12px',
    borderRadius: 8,
    background: '#111827',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
  },
  addingBtn: {
    padding: '8px 12px',
    borderRadius: 8,
    background: '#10b981',
    color: '#fff',
    border: 'none',
    cursor: 'default',
    fontWeight: 700,
  },
  viewBtn: { padding: '8px 12px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(15,23,42,0.04)', textDecoration: 'none', color: '#111827', fontWeight: 700 },

  toast: {
    position: 'fixed',
    right: 20,
    bottom: 24,
    background: '#111827',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: 10,
    boxShadow: '0 8px 28px rgba(2,6,23,0.2)',
    fontWeight: 700,
    zIndex: 9999,
    opacity: 0.98
  },

  headerSkeleton: { marginBottom: 12 },
  skelTitle: { height: 20, width: 240, marginBottom: 8, borderRadius: 6, background: '#f3f4f6' },
  skelSubtitle: { height: 12, width: 360, borderRadius: 6, background: '#f3f4f6' },

  errBox: { padding: 18, background: '#fff1f2', color: '#b91c1c', borderRadius: 10, textAlign: 'center' },
  reloadBtn: { marginRight: 8, padding: '8px 10px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff', cursor: 'pointer' },
  linkBtn: { padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)', background: 'transparent', textDecoration: 'none', color: '#111827', marginLeft: 8, fontWeight: 700 },
  primaryBtn: { padding: '8px 10px', borderRadius: 8, background: '#111827', color: '#fff', textDecoration: 'none', fontWeight: 700 },

  empty: { color: '#6b7280', padding: 12 }
};
