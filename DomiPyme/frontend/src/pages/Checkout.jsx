// src/pages/Checkout.jsx
import React, { useMemo, useState, useEffect } from 'react';
import api from '../components/Api';
import { useNavigate } from 'react-router-dom';

function formatCurrency(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(n);
}

/**
 * Checkout.jsx
 * - Diseño coherente con Catalog y Cart (tarjetas blancas, sombras)
 * - Animaciones: entrada de página, entrada del resumen, microinteracciones
 * - Normaliza el carrito (quantity / qty) y muestra imágenes si las hay
 * - Validaciones simples y comportamiento similar al componente original
 */

export default function Checkout() {
  const nav = useNavigate();

  // Normalizar carrito del localStorage (compatibilidad qty / quantity)
  const rawCart = JSON.parse(localStorage.getItem('dp_cart') || '[]');
  const cart = rawCart.map((it) => ({
    uid: it.uid ?? it.id ?? `${it.name}_${Math.random().toString(36).slice(2,6)}`,
    title: it.title || it.name || 'Producto',
    price: Number(it.price || it.amount || it.unit_price || 0),
    quantity: Number(it.quantity ?? it.qty ?? it.q ?? 1),
    image: it.image || it.img || it.thumbnail || null,
    raw: it,
  }));

  // Form state
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'CO',
  });

  const [shippingMethod, setShippingMethod] = useState('standard'); // 'standard' | 'express' | 'pickup'
  const [paymentMethod, setPaymentMethod] = useState('external'); // 'external' | 'card' | 'cod'
  const [card, setCard] = useState({ number: '', exp: '', cvc: '' }); // sandbox
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // animación de entrada
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Shipping options
  const shippingOptions = {
    standard: { label: 'Estándar (3-5 días)', cost: 8000 },
    express: { label: 'Express (1-2 días)', cost: 18000 },
    pickup: { label: 'Recogida en tienda', cost: 0 },
  };

  const subtotal = useMemo(() => {
    return cart.reduce((s, it) => s + Number(it.price || 0) * (Number(it.quantity) || 1), 0);
  }, [rawCart]); // recalcular si cambia rawCart

  const shippingCost = shippingOptions[shippingMethod]?.cost || 0;
  const tax = Math.round(subtotal * 0.19); // 19% IVA ejemplo
  const total = subtotal + shippingCost + tax;

  const validateAddress = () => {
    const required = ['name', 'phone', 'line1', 'city', 'postal_code'];
    for (let key of required) {
      if (!address[key] || address[key].toString().trim() === '') {
        return `Por favor completa ${key}`;
      }
    }
    return null;
  };

  const submit = async () => {
    if (loading) return;
    if (cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    const addrErr = validateAddress();
    if (addrErr) {
      alert(addrErr);
      return;
    }

    if (paymentMethod === 'card') {
      if (!card.number || !card.exp || !card.cvc) {
        alert('Completa los datos de la tarjeta (sandbox)');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        items: cart.map((c) => ({ title: c.title, price: c.price, quantity: c.quantity })),
        shipping_address: address,
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        payment_details: paymentMethod === 'card' ? card : null,
        notes,
        totals: { subtotal, shipping: shippingCost, tax, total },
      };

      const res = await api.post('orders/checkout/', payload);

      if (res.data?.payment_url) {
        window.location.href = res.data.payment_url;
        return;
      }

      if (res.data?.order_id) {
        localStorage.removeItem('dp_cart');
        nav(`/order/success?order_id=${res.data.order_id}`);
        return;
      }

      if (res.data?.success) {
        localStorage.removeItem('dp_cart');
        nav('/order/success');
        return;
      }

      alert('No se pudo completar el pedido. Revisa la consola.');
      console.error('Checkout unexpected response:', res.data);
    } catch (err) {
      console.error('Checkout error:', err);
      const message = err?.response?.data?.detail || 'Error procesando el pago. Intenta nuevamente.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page} className={mounted ? 'page-enter' : ''}>
      {/* Animaciones y estilos globales del page (inline) */}
      <style>{`
        /* entrada de página */
        .page-enter { animation: pageEnter 320ms ease both; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* micro interacciones */
        .btn-primary {
          transition: transform 180ms ease, box-shadow 180ms ease, opacity 120ms ease;
        }
        .btn-primary:active { transform: translateY(1px) scale(0.997); }
        .input-field {
          transition: box-shadow 180ms ease, transform 160ms ease;
        }
        .input-field:focus {
          outline: none;
          box-shadow: 0 6px 18px rgba(17,24,39,0.06);
          transform: translateY(-1px);
        }

        /* resumen entry */
        .summary-enter { animation: summaryEnter 420ms cubic-bezier(.2,.9,.2,1) both; }
        @keyframes summaryEnter { from { opacity: 0; transform: translateX(8px) } to { opacity: 1; transform: translateX(0) } }

        /* animación de línea total */
        .total-anim { transition: transform 220ms ease, color 220ms ease; }
      `}</style>

      <div style={styles.left}>
        <h2 style={{ marginTop: 0 }}>Checkout</h2>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Dirección de envío</h3>
          <div style={styles.grid}>
            <input
              className="input-field"
              placeholder="Nombre completo"
              value={address.name}
              onChange={(e) => setAddress({ ...address, name: e.target.value })}
              style={styles.input}
            />
            <input
              className="input-field"
              placeholder="Teléfono"
              value={address.phone}
              onChange={(e) => setAddress({ ...address, phone: e.target.value })}
              style={styles.input}
            />
            <input
              className="input-field"
              placeholder="Dirección (calle, número, apto)"
              value={address.line1}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              style={{ ...styles.input, gridColumn: '1 / -1' }}
            />
            <input
              className="input-field"
              placeholder="Ciudad"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              style={styles.input}
            />
            <input
              className="input-field"
              placeholder="Departamento/Estado"
              value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
              style={styles.input}
            />
            <input
              className="input-field"
              placeholder="Código postal"
              value={address.postal_code}
              onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
              style={styles.input}
            />
          </div>
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Método de envío</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(shippingOptions).map(([key, opt]) => (
              <label key={key} style={styles.radioRow}>
                <input
                  type="radio"
                  name="shipping"
                  value={key}
                  checked={shippingMethod === key}
                  onChange={() => setShippingMethod(key)}
                />
                <div style={{ marginLeft: 10 }}>
                  <div style={{ fontWeight: 700 }}>{opt.label}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{formatCurrency(opt.cost)}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Método de pago</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={styles.radioRow}>
              <input
                type="radio"
                name="payment"
                value="external"
                checked={paymentMethod === 'external'}
                onChange={() => setPaymentMethod('external')}
              />
              <div style={{ marginLeft: 10 }}>
                <div style={{ fontWeight: 700 }}>Pasarela de pago</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Redirige al proveedor (tarjeta / PSE)</div>
              </div>
            </label>

            <label style={styles.radioRow}>
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              <div style={{ marginLeft: 10 }}>
                <div style={{ fontWeight: 700 }}>Tarjeta (sandbox)</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Procesado por el backend (solo sandbox)</div>
              </div>
            </label>

            <label style={styles.radioRow}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
              />
              <div style={{ marginLeft: 10 }}>
                <div style={{ fontWeight: 700 }}>Pago contra entrega</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Paga cuando recibas el pedido</div>
              </div>
            </label>
          </div>

          {paymentMethod === 'card' && (
            <div style={{ ...styles.section, marginTop: 12 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>Datos de la tarjeta (sandbox)</h4>
              <input
                className="input-field"
                placeholder="Número de tarjeta"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: e.target.value })}
                style={styles.input}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input-field"
                  placeholder="MM/AA"
                  value={card.exp}
                  onChange={(e) => setCard({ ...card, exp: e.target.value })}
                  style={{ ...styles.input, flex: 1 }}
                />
                <input
                  className="input-field"
                  placeholder="CVC"
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                  style={{ width: 120 }}
                />
              </div>
              <small style={{ color: '#6b7280' }}>En producción: maneja tarjetas desde el proveedor (Stripe, PayU, etc.).</small>
            </div>
          )}
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Notas</h3>
          <textarea
            placeholder="Instrucciones para el envío (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: '100%', minHeight: 84, padding: 10, borderRadius: 8, border: '1px solid #e6e9ef' }}
          />
        </section>

        <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={submit}
            disabled={loading}
            className="btn-primary"
            style={{
              padding: '10px 16px',
              background: '#111827',
              color: '#fff',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: loading ? 'inset 0 0 6px rgba(0,0,0,0.08)' : '0 6px 18px rgba(17,24,39,0.06)',
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? 'Procesando...' : `Pagar ${formatCurrency(total)}`}
          </button>

          <button
            onClick={() => nav('/catalog')}
            style={{
              padding: '10px 14px',
              background: 'transparent',
              border: '1px solid rgba(17,24,39,0.06)',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            Seguir comprando
          </button>
        </div>
      </div>

      <aside style={styles.right} className={mounted ? 'summary-enter' : ''}>
        <CartSummary cart={cart} subtotal={subtotal} shipping={shippingCost} tax={tax} total={total} />
      </aside>
    </div>
  );
}

/* ---------------- CartSummary ---------------- */
function CartSummary({ cart, subtotal, shipping, tax, total }) {
  const placeholder = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='12'>No Img</text></svg>`
  );

  return (
    <div style={styles.summary}>
      <h3 style={{ marginTop: 0 }}>Resumen del pedido</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cart.length === 0 && <div style={{ color: '#6b7280' }}>Tu carrito está vacío</div>}
        {cart.map((it) => (
          <div key={it.uid} style={styles.itemRow}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <img src={it.image || placeholder} alt={it.title} style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 6 }} />
              <div>
                <div style={{ fontWeight: 700 }}>{it.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{it.quantity} x {formatCurrency(it.price)}</div>
              </div>
            </div>
            <div style={{ fontWeight: 800 }}>{formatCurrency((it.price || 0) * (it.quantity || 1))}</div>
          </div>
        ))}
      </div>

      <hr style={{ margin: '12px 0' }} />

      <div style={styles.totalsRow}>
        <div>Subtotal</div>
        <div>{formatCurrency(subtotal)}</div>
      </div>
      <div style={styles.totalsRow}>
        <div>Envío</div>
        <div>{formatCurrency(shipping)}</div>
      </div>
      <div style={styles.totalsRow}>
        <div>IVA (19%)</div>
        <div>{formatCurrency(tax)}</div>
      </div>

      <hr style={{ margin: '12px 0' }} />

      <div style={{ ...styles.totalsRow, fontSize: 18, fontWeight: 900 }} className="total-anim">
        <div>Total</div>
        <div>{formatCurrency(total)}</div>
      </div>
    </div>
  );
}

/* ---------------- Styles ---------------- */
const styles = {
  page: {
    display: 'flex',
    gap: 24,
    padding: 20,
    alignItems: 'flex-start',
    maxWidth: 1200,
    margin: '0 auto',
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  },
  left: { flex: 1, maxWidth: 760 },
  right: { width: 380, minWidth: 300 },
  section: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 10,
    background: '#fff',
    boxShadow: '0 1px 6px rgba(2,6,23,0.04)',
    border: '1px solid rgba(15,23,42,0.03)',
  },
  sectionTitle: { margin: '0 0 8px 0' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  radioRow: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 8, border: '1px solid transparent', cursor: 'pointer' },
  input: { padding: 10, borderRadius: 8, border: '1px solid #e6e9ef', width: '100%' },
  summary: { padding: 14, borderRadius: 10, background: '#fff', boxShadow: '0 6px 24px rgba(2,6,23,0.06)', border: '1px solid rgba(15,23,42,0.03)' },
  itemRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed rgba(17,24,39,0.04)', alignItems: 'center' },
  totalsRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0' },
};

