// src/pages/ShopDetail.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../components/Api';

export default function ShopDetail() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);
    setShop(null);
    setProducts([]);

    const controller = new AbortController();

    const load = async () => {
      try {
        // 1) intentar endpoint por slug (nuestra convención)
        const resp = await api.get(`shops/slug/${encodeURIComponent(slug)}/`, { signal: controller.signal });
        if (!mountedRef.current) return;
        setShop(resp.data);

        // 2) intentar cargar productos por shop slug (action list_by_shop)
        try {
          const params = new URLSearchParams();
          if (searchTerm) params.append('search', searchTerm);
          if (priceMin) params.append('price_min', priceMin);
          if (priceMax) params.append('price_max', priceMax);
          if (inStockOnly) params.append('in_stock', 'true');
          const queryString = params.toString();
          const url = `products/by-shop/${encodeURIComponent(slug)}/${queryString ? '?' + queryString : ''}`;
          const pResp = await api.get(url, { signal: controller.signal });
          if (!mountedRef.current) return;
          const data = pResp.data;
          const list = Array.isArray(data) ? data : (data.results || []);
          setProducts(list);
        } catch (e) {
          // fallback: si el endpoint anterior falla, intentar por shop id
          try {
            const shopId = resp.data?.id;
            if (shopId) {
              const p2 = await api.get(`products/?shop=${encodeURIComponent(String(shopId))}`, { signal: controller.signal });
              if (!mountedRef.current) return;
              // si viene paginado: search results.results
              const data = p2.data;
              const list = Array.isArray(data) ? data : (data.results || data.data || []);
              setProducts(list);
            }
          } catch (e2) {
            // no hay productos o endpoint no existe
            setProducts([]);
          }
        }
      } catch (err) {
        // fallback: listar shops y buscar por slug
        try {
          const listResp = await api.get('shops/');
          const all = listResp.data?.results || listResp.data || [];
          const found = (Array.isArray(all) ? all : all.results || []).find(s => {
            const sslug = (s.slug || String(s.id || '')).toString().toLowerCase();
            return sslug === (slug || '').toString().toLowerCase();
          });
          if (!found) throw new Error('Tienda no encontrada');
          if (!mountedRef.current) return;
          setShop(found);

          // intentar cargar productos por shop id
          try {
            const p2 = await api.get(`products/?shop=${encodeURIComponent(String(found.id))}`);
            const data = p2.data;
            const list = Array.isArray(data) ? data : (data.results || data.data || []);
            setProducts(list);
          } catch (e) {
            setProducts([]);
          }
        } catch (e) {
          console.error('ShopDetail error:', err, e);
          setError('No se pudo cargar la tienda. Revisa la consola o intenta más tarde.');
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    if (!slug) {
      setError('Slug inválido.');
      setLoading(false);
    } else {
      load();
    }

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [slug, searchTerm, priceMin, priceMax, inStockOnly]);

  if (loading) return <div style={{ padding: 20 }}>Cargando tienda...</div>;
  if (error) return (
    <div style={{ padding: 20 }}>
      <div style={{ color: '#b91c1c', background: '#fff1f2', padding: 12, borderRadius: 8 }}>{error}</div>
      <div style={{ marginTop: 10 }}>
        <Link to="/catalog">Volver al catálogo</Link>
      </div>
    </div>
  );
  if (!shop) return <div style={{ padding: 20 }}>Tienda no encontrada.</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>{shop.name}</h1>
          {shop.description && <p style={{ color: '#475569' }}>{shop.description}</p>}
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            {shop.address ? shop.address : ''} {shop.phone ? `• ${shop.phone}` : ''}
          </div>
        </div>
        <div>
          <Link to="/catalog" style={{ textDecoration: 'none', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)' }}>Volver al catálogo</Link>
        </div>
      </header>

      <main>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Productos</h3>
        </div>
        
        {/* Filtros */}
        <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar productos..."
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', minWidth: 200 }}
          />
          <input
            type="number"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            placeholder="Precio mín."
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', width: 120 }}
          />
          <input
            type="number"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            placeholder="Precio máx."
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', width: 120 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            Solo en stock
          </label>
          {(searchTerm || priceMin || priceMax || inStockOnly) && (
            <button
              onClick={() => { setSearchTerm(''); setPriceMin(''); setPriceMax(''); setInStockOnly(false); }}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
        
        {(!products || products.length === 0) ? (
          <div style={{ color: '#6b7280', padding: 8 }}>No hay productos disponibles.</div>
        ) : (
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, listStyle: 'none', padding: 0 }}>
            {products.map((p) => (
              <li key={p.id || p.pk || p._id} style={{ background: '#fff', borderRadius: 10, padding: 12, boxShadow: '0 6px 18px rgba(2,6,23,0.04)' }}>
                <div style={{ fontWeight: 800 }}>{p.name || p.title}</div>
                <div style={{ color: '#6b7280', marginTop: 6 }}>{String(p.description || '').slice(0, 80)}</div>
                <div style={{ marginTop: 12, fontWeight: 800 }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(p.price || 0))}</div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
