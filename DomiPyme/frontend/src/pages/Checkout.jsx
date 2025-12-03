// src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import StripeCheckoutForm from '../components/StripeCheckoutForm';
import getStripe from '../config/stripe';
import api from '../components/Api';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, getSubtotal, clearCart, loading: cartLoading } = useCart();

  // State
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'CO',
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [step, setStep] = useState('address'); // 'address' | 'payment'

  // Pricing calculations
  const subtotal = getSubtotal();
  const shippingCost = 0; // Could be calculated based on address or cart weight
  const tax = Math.round(subtotal * 0.19); // 19% IVA
  const total = subtotal + shippingCost + tax;

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && (!cart || cart.items?.length === 0)) {
      navigate('/cart');
    }
  }, [cart, cartLoading, navigate]);

  const validateAddress = () => {
    const required = ['full_name', 'phone', 'address_line1', 'city', 'postal_code'];
    for (let key of required) {
      if (!shippingAddress[key] || shippingAddress[key].toString().trim() === '') {
        return `Por favor completa ${key.replace('_', ' ')}`;
      }
    }
    return null;
  };

  const handleContinueToPayment = async () => {
    const addressError = validateAddress();
    if (addressError) {
      setError(addressError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create order with shipping address
      const payload = {
        items: cart.items.map((item) => ({
          product: item.product.id,
          qty: item.quantity,
        })),
        shipping_address: shippingAddress,
        notes,
      };

      const { data } = await api.post('/orders/', payload);
      setOrderId(data.id);
      setStep('payment');
    } catch (err) {
      console.error('Order creation error:', err);
      setError(err.response?.data?.detail || 'Error al crear la orden');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    // Clear cart and redirect to success page
    await clearCart();
    navigate(`/order/success?order_id=${orderId}&payment_intent=${paymentIntent.id}`);
  };

  const handlePaymentError = (err) => {
    setError('Error al procesar el pago. Por favor, intenta de nuevo.');
  };

  if (cartLoading) {
    return (
      <div className="loading-spinner">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="checkout-steps">
          <div className={`step ${step === 'address' ? 'active' : step === 'payment' ? 'completed' : ''}`}>
            1. Dirección
          </div>
          <div className={`step ${step === 'payment' ? 'active' : ''}`}>
            2. Pago
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="checkout-content">
        {step === 'address' ? (
          <div className="checkout-form">
            <div className="form-section">
              <h2>Dirección de Envío</h2>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={shippingAddress.full_name}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                  className="form-input"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Dirección línea 1"
                  value={shippingAddress.address_line1}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                  className="form-input full-width"
                />
                <input
                  type="text"
                  placeholder="Dirección línea 2 (opcional)"
                  value={shippingAddress.address_line2}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })}
                  className="form-input full-width"
                />
                <input
                  type="text"
                  placeholder="Ciudad"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Estado/Provincia"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  className="form-input"
                />
                <input
                  type="text"
                  placeholder="Código Postal"
                  value={shippingAddress.postal_code}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-section">
                <h3>Notas (opcional)</h3>
                <textarea
                  placeholder="Instrucciones especiales para la entrega"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <button
                onClick={handleContinueToPayment}
                disabled={loading}
                className="btn btn-checkout"
              >
                {loading ? 'Procesando...' : 'Continuar al Pago'}
              </button>
            </div>
          </div>
        ) : (
          <div className="checkout-form">
            <div className="form-section">
              <h2>Información de Pago</h2>
              <Elements stripe={getStripe()}>
                <StripeCheckoutForm
                  orderId={orderId}
                  amount={total}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>

              <button
                onClick={() => setStep('address')}
                className="btn btn-secondary"
                style={{ marginTop: '16px' }}
              >
                Volver a Dirección
              </button>
            </div>
          </div>
        )}

        <div className="checkout-summary">
          <h2>Resumen de la Orden</h2>

          <div className="summary-items">
            {cart?.items?.map((item) => (
              <div key={item.id} className="summary-item">
                <img 
                  src={item.product.image || '/placeholder.png'} 
                  alt={item.product.name}
                  className="summary-item-image"
                />
                <div className="summary-item-details">
                  <h4>{item.product.name}</h4>
                  <p>Cantidad: {item.quantity}</p>
                  <p className="summary-item-price">
                    ${item.price_snapshot.toLocaleString('es-CO')}
                  </p>
                </div>
                <div className="summary-item-total">
                  ${(item.price_snapshot * item.quantity).toLocaleString('es-CO')}
                </div>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="summary-row">
              <span>Envío:</span>
              <span>{shippingCost === 0 ? 'GRATIS' : `$${shippingCost.toLocaleString('es-CO')}`}</span>
            </div>
            <div className="summary-row">
              <span>IVA (19%):</span>
              <span>${tax.toLocaleString('es-CO')}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total:</span>
              <span>${total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
