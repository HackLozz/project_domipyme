// src/pages/MyOrders.jsx
import React, { useEffect, useState } from 'react';
import '../components/ui/Design.css';
import api from '../components/Api';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(n || 0));

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('orders/my/')
      .then(res => setOrders(res.data))
      .catch(e => {
        console.error('Orders load error', e);
        setErr('No se pudieron cargar tus pedidos.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="section">Cargando...</div></div>;
  if (err) return <div className="page"><div className="section">{err}</div></div>;

  return (
    <div className="page">
      <div className="section">
        <h2 className="title">Mis pedidos</h2>
        {orders.length === 0 ? (
          <p className="muted">Aún no tienes pedidos.</p>
        ) : (
          <div className="grid">
            {orders.map((o) => (
              <div key={o.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>Pedido #{o.id}</div>
                      <div className="muted">Tienda: {o.shop_name || o.shop}</div>
                    </div>
                    <div style={{ fontWeight: 900 }}>{fmt(o.total)}</div>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className="muted">Estado: {o.status || (o.payment_confirmed ? 'paid' : 'pending')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
