// src/components/StripeCheckoutForm.jsx
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from './Api';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#111827',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626',
    },
  },
  hidePostalCode: true,
};

export default function StripeCheckoutForm({ orderId, amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe no está listo. Por favor, intenta de nuevo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create payment intent on backend
      const { data } = await api.post('/payments/create-intent/', {
        order_id: orderId,
        amount: amount,
      });

      if (!data.client_secret) {
        throw new Error('No se recibió el client_secret del servidor');
      }

      // Step 2: Confirm card payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        data.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Payment successful
        if (onSuccess) {
          onSuccess(paymentIntent);
        }
      } else {
        throw new Error(`Estado del pago inesperado: ${paymentIntent.status}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      const message = err.response?.data?.detail || err.message || 'Error al procesar el pago';
      setError(message);
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-checkout-form">
      <div className="card-element-container">
        <label className="card-label">Información de la tarjeta</label>
        <div className="card-element-wrapper">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ marginTop: '16px' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn btn-checkout"
        style={{ marginTop: '20px', width: '100%' }}
      >
        {loading ? 'Procesando...' : `Pagar $${amount.toLocaleString('es-CO')}`}
      </button>

      <p className="secure-text" style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.875rem', color: '#6b7280' }}>
        🔒 Pago seguro con Stripe
      </p>
    </form>
  );
}
