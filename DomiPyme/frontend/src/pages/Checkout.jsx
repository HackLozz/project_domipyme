import React, {useState} from 'react'
import api from '../components/Api'
import { useNavigate } from 'react-router-dom'

export default function Checkout(){
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    setLoading(true);
    const cart = JSON.parse(localStorage.getItem('dp_cart') || '[]');
    try {
      // Backend endpoint: POST /orders/checkout/  { items: cart }
      const res = await api.post('orders/checkout/', { items: cart });
      // if backend returns a payment_url, redirect user
      if(res.data.payment_url){
        window.location.href = res.data.payment_url;
      } else {
        // otherwise assume order created and paid in sandbox
        localStorage.removeItem('dp_cart');
        nav('/');
      }
    } catch (e){
      alert('Error en checkout');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Checkout</h2>
      <button className="btn" onClick={submit} disabled={loading}>{loading ? 'Procesando...' : 'Pagar'}</button>
    </div>
  )
}
