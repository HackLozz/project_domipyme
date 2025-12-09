// src/pages/OrderSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './OrderSuccess.css';

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
    <div className="order-success-page">
      <div className="order-success-container">
        <div className="order-success-icon-wrapper">
          <span className="order-success-icon">✓</span>
        </div>
        
        <h1 className="order-success-title">¡Tu pedido fue creado!</h1>
        <p className="order-success-subtitle">
          Gracias por tu compra. Recibirás un correo con la confirmación.
        </p>

        {orderId && (
          <div className="order-success-order-id">
            <p className="order-success-order-label">Número de pedido</p>
            <h2 className="order-success-order-number">#{orderId}</h2>
          </div>
        )}

        <div className="order-success-info">
          <div className="order-success-info-box">
            <div className="order-success-info-icon">📧</div>
            <div className="order-success-info-text">
              <h4>Correo de confirmación</h4>
              <p>Te enviaremos los detalles a tu correo electrónico</p>
            </div>
          </div>
        </div>

        <div className="order-success-actions">
          <Link to="/orders" className="order-success-button order-success-button-primary">
            <span>📦</span>
            Ver mis pedidos
          </Link>
          <Link to="/" className="order-success-button order-success-button-secondary">
            <span>🏠</span>
            Volver al inicio
          </Link>
        </div>

        {cleared && (
          <div className="order-success-info-box" style={{ marginTop: '20px', background: '#d1fae5' }}>
            <div className="order-success-info-icon" style={{ background: '#10b981' }}>✓</div>
            <div className="order-success-info-text">
              <p style={{ color: '#065f46', margin: 0 }}>Carrito limpiado exitosamente</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
