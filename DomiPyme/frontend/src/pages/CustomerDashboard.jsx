// src/pages/CustomerDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import api from '../components/Api';
import { Link } from 'react-router-dom';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [myShops, setMyShops] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      // intentar cargar orders/my/ y shops/my/ si existen (no fallar si no)
      try {
        const [oRes, sRes] = await Promise.allSettled([
          api.get('orders/my/'),
          api.get('shops/my/')
        ]);

        if (!mounted) return;

        setOrders(oRes.status === 'fulfilled' ? (oRes.value.data || []) : []);
        setMyShops(sRes.status === 'fulfilled' ? (sRes.value.data || []) : []);
      } catch (e) {
        // ignore
        setOrders([]);
        setMyShops([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  if (!user) return <div style={{ padding: 20 }}>Necesitas iniciar sesión para ver el dashboard.</div>;
  if (loading) return <div style={{ padding: 20 }}>Cargando dashboard...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <h1>Hola, {user.first_name || user.email}</h1>
      <p>Este es tu panel personal — desde aquí puedes ver tus pedidos, editar tu perfil y gestionar tus tiendas (si eres comerciante).</p>

      <section style={{ marginTop: 20 }}>
        <h3>Cuenta</h3>
        <div>Email: {user.email}</div>
        <div>Rol: {user.role || 'cliente'}</div>
        <div style={{ marginTop: 8 }}>
          <Link to="/profile">Editar perfil</Link>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Pedidos recientes</h3>
        {(!orders || orders.length === 0) ? (
          <div>No hay pedidos recientes.</div>
        ) : (
          <ul>
            {orders.map(o => <li key={o.id}>{o.id} — {o.status}</li>)}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h3>Mis tiendas</h3>
        {user?.role === 'merchant' ? (
          <>
            {(!myShops || myShops.length === 0) ? (
              <div>No tienes tiendas todavía.</div>
            ) : (
              myShops.map(s => (
                <div key={s.id} style={{ marginBottom: 8 }}>
                  <Link to={`/shop/${s.slug}`}>{s.name}</Link> — <Link to="/merchant/shop/edit">Editar</Link>
                </div>
              ))
            )}
          </>
        ) : (
          <div>Si tienes una tienda, aparecerá aquí.</div>
        )}
      </section>
    </div>
  );
}
