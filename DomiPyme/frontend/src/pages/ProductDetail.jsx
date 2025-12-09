// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../components/Api';
import { showToast } from '../components/Toast';
import StarRating from '../components/StarRating';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import { useAuth } from '../context/AuthProvider';
import './ProductDetail.css';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(n || 0));

const firstDefined = (...vals) => {
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
};

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [adding, setAdding] = useState(false);
  const [reviewKey, setReviewKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    api.get(`products/${encodeURIComponent(id)}/`)
      .then(res => setProduct(res.data))
      .catch(e => {
        console.error('Product load error', e);
        setErr('No se pudo cargar el producto.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = () => {
    if (!product) return;
    setAdding(true);
    let raw = [];
    try {
      raw = JSON.parse(localStorage.getItem('dp_cart') || '[]');
      if (!Array.isArray(raw)) raw = [];
    } catch { raw = []; }

    const pid = String(firstDefined(product.id, product.pk, id));
    const shopId = String(firstDefined(product.shop, product.shop_id, product.shopId, '')) || null;

    const idx = raw.findIndex((it) => String(it.product_id) === pid && String(it.shop_id) === shopId);
    if (idx >= 0) {
      raw[idx].qty = (Number(raw[idx].qty) || 1) + 1;
      raw[idx].price = Number(firstDefined(product.price, raw[idx].price));
      raw[idx].name = firstDefined(product.name, raw[idx].name);
      raw[idx].image = firstDefined(product.image, raw[idx].image);
      raw[idx].raw = product;
      showToast('Cantidad actualizada en el carrito', 'success', 2000);
    } else {
      raw.unshift({
        uid: `${Date.now()}_${Math.random().toString(36).slice(2,8)}_p${pid}`,
        product_id: pid,
        shop_id: shopId,
        name: firstDefined(product.name, 'Producto'),
        price: Number(firstDefined(product.price, 0)),
        qty: 1,
        image: firstDefined(product.image, null),
        raw: product,
      });
      showToast('Producto agregado al carrito', 'success', 2000);
    }

    try { localStorage.setItem('dp_cart', JSON.stringify(raw)); } catch {}
    window.dispatchEvent(new Event('dp_cart_updated'));
    setTimeout(() => setAdding(false), 400);
  };

  if (loading) return <div style={{ padding: 20 }}>Cargando...</div>;
  if (err) return <div style={{ padding: 20 }}>{err}</div>;
  if (!product) return <div style={{ padding: 20 }}>Producto no encontrado.</div>;

  const avgRating = product.avg_rating || 0;
  const reviewCount = product.review_count || 0;

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <Link to={product?.shop_slug ? `/shop/${product.shop_slug}` : '/catalog'} style={{ textDecoration: 'none' }}>&larr; Volver</Link>
      
      {/* Sección de Producto */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
        <div style={{ flex: '0 0 380px', background: '#f7f7f7', borderRadius: 12, overflow: 'hidden' }}>
          <img src={firstDefined(product.image, 'https://via.placeholder.com/600x400?text=Producto')} alt={product.name}
               style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ marginTop: 0 }}>{product.name}</h2>
          
          {/* Rating y Reviews */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <StarRating rating={avgRating} size="medium" showLabel={true} />
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                {reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}
              </p>
            </div>
          </div>

          {product.description && <p style={{ color: '#475569' }}>{product.description}</p>}
          <div style={{ fontSize: 22, fontWeight: 900, margin: '8px 0 16px' }}>{fmt(product.price)}</div>
          <button onClick={addToCart} disabled={adding}
                  style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#111827', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
            {adding ? 'Añadiendo...' : 'Agregar al carrito'}
          </button>
        </div>
      </div>

      {/* Sección de Reviews */}
      <div style={{ marginTop: 40, borderTop: '2px solid #e5e7eb', paddingTop: 40 }}>
        <h3 style={{ marginTop: 0, color: '#111827' }}>Reseñas y Calificaciones</h3>
        
        {/* Formulario de Reseña - Solo si está autenticado */}
        {user ? (
          <ReviewForm 
            key={reviewKey}
            productId={id} 
            onSuccess={() => {
              showToast('Reseña publicada exitosamente', 'success', 2000);
              setReviewKey(reviewKey + 1);
            }}
          />
        ) : (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16, marginBottom: 24, color: '#1e40af' }}>
            <p style={{ margin: 0 }}>
              🔐 <strong>Inicia sesión</strong> para dejar una reseña
            </p>
          </div>
        )}

        {/* Lista de Reseñas */}
        <ReviewList 
          key={reviewKey}
          productId={id} 
          onReviewUpdate={() => {
            // Recargar producto para actualizar el rating
            api.get(`products/${encodeURIComponent(id)}/`)
              .then(res => setProduct(res.data))
              .catch(e => console.error('Error reloading product:', e));
          }}
        />
      </div>
    </div>
  );
}
