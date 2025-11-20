// src/pages/Login.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const from = location.state?.from?.pathname || '/dashboard';

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Usa la función login del contexto (evita duplicar peticiones)
      await auth.login(email, password, from);
      // auth.login redirige internamente
    } catch (err) {
      // intenta obtener un mensaje de error del servidor si existe
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.message ||
        'Credenciales inválidas';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Iniciar sesión</h2>

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            type="email"
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            required
            minLength={6}
          />

          {error && <div style={styles.error}>{error}</div>}

          <button
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Validando...' : 'Entrar'}
          </button>
        </form>

        <div style={styles.links}>
          <Link to="/forgot-password" style={styles.link}>¿Olvidaste tu contraseña?</Link>
          <Link to="/register" style={styles.link}>¿No tienes cuenta? Regístrate</Link>
          <Link to="/" style={styles.link}>Volver al Home</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f3f4f6' },
  card: { width: '100%', maxWidth: 420, background: '#fff', padding: 28, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
  title: { textAlign: 'center', marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontWeight: 600 },
  input: { padding: 10, borderRadius: 8, border: '1px solid #d1d5db' },
  button: { marginTop: 10, padding: 12, background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '700' },
  error: { color: 'red' },
  links: { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' },
  link: { color: '#2563eb', textDecoration: 'none', fontWeight: 700 }
};
