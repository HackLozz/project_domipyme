// Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../components/Api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await api.post('auth/register/', { email, password });
      nav('/login');
    } catch (err) {
      setError('Error en el registro');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Crear cuenta</h2>

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} style={styles.input} />

          <label style={styles.label}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button}>Crear cuenta</button>
        </form>

        <div style={styles.links}>
          <Link to="/login" style={styles.link}>Ya tengo cuenta / Iniciar sesión</Link>
          <Link to="/" style={styles.link}>Volver al Home</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  ...{
    container: { minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f3f4f6' },
    card: { width: '100%', maxWidth: 420, background: '#fff', padding: 28, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
    title: { textAlign: 'center', marginBottom: 16 },
    form: { display: 'flex', flexDirection: 'column', gap: 10 },
    label: { fontWeight: 600 },
    input: { padding: 10, borderRadius: 8, border: '1px solid #d1d5db' },
    button: { marginTop: 10, padding: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '700' },
    error: { color: 'red' },
    links: { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' },
    link: { color: '#2563eb', textDecoration: 'none', fontWeight: 700 }
  }
};
