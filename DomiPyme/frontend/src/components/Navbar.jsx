// Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const nav = useNavigate();
  const token = localStorage.getItem('access_token');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    nav('/login');
  };

  return (
    <nav style={styles.nav}>
      <div>
        <Link to="/" style={styles.brand}>DomiPyme</Link>
      </div>

      <div style={styles.links}>
        <Link to="/" style={styles.link}>Home</Link>
        {token ? (
          <>
            <Link to="/dashboard" style={styles.link}>Dashboard</Link>
            <button onClick={handleLogout} style={styles.btn}>Cerrar sesión</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Iniciar sesión</Link>
            <Link to="/register" style={styles.link}>Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: '#111827',
    color: 'white',
    alignItems: 'center',
  },
  brand: { color: 'white', textDecoration: 'none', fontWeight: '700' },
  links: { display: 'flex', gap: '12px', alignItems: 'center' },
  link: { color: 'white', textDecoration: 'none', fontWeight: '600' },
  btn: {
    background: 'transparent',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '6px 10px',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};
