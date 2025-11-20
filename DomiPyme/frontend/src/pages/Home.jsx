// Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Bienvenido a DomiPyme</h1>
        <p>Descubre la web de los comercios.</p>

        <div style={styles.actions}>
          <Link to="/register" style={styles.cta}>Crear cuenta</Link>
          <Link to="/login" style={styles.link}>Iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  card: { padding: 30, borderRadius: 12, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: 700 },
  actions: { marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' },
  cta: { padding: '10px 16px', background: '#2563eb', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 700 },
  link: { padding: '10px 16px', textDecoration: 'none', color: '#2563eb', fontWeight: 700 }
};
