// src/pages/OrderSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const [search] = useSearchParams();
  const orderId = search.get('order_id');
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // ensure cart cleared after success
    localStorage.removeItem('dp_cart');
    setCleared(true);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>¡Tu pedido fue creado!</h2>
      <p>Gracias por tu compra. {orderId ? <>Tu número de pedido es <strong>#{orderId}</strong>.</> : 'Recibirás un correo con la confirmación.'}</p>

      <div style={{ marginTop: 12 }}>
        <Link to="/">Volver al inicio</Link>
      </div>

      {cleared ? <div style={{ marginTop: 8, color: 'green' }}>Carrito limpiado.</div> : null}
    </div>
  );
}
