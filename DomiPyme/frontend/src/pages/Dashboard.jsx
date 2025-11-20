// Dashboard.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const nav = useNavigate();

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    nav('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>Dashboard</h1>
        <p>Bienvenido — esta es tu vista privada.</p>

        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <Link to="/" style={styles.link}>Ver Home público</Link>
          <button onClick={logout} style={styles.logout}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  card: { padding: 30, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: 720 },
  link: { textDecoration: 'none', padding: '10px 14px', borderRadius: 10, background: '#2563eb', color: 'white', fontWeight: 700 },
  logout: { padding: '10px 14px', borderRadius: 10, background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }
};
