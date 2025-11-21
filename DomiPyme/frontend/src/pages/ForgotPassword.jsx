// src/pages/ForgotPassword.jsx
import React, { useEffect, useState } from 'react';
import api from '../components/Api';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 8);
    return () => clearTimeout(t);
  }, []);

  const validateEmail = (v) => {
    if (!v) return 'Ingresa tu email';
    // simple email check
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(v) ? null : 'Email inválido';
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    const v = validateEmail(email.trim());
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      // Ajusta endpoint según tu backend si es diferente
      await api.post('auth/forgot-password/', { email: email.trim() });
      setMsg('Si existe una cuenta con ese email, recibirás instrucciones por correo.');
    } catch (err) {
      console.error('ForgotPassword error:', err);
      // Intentar extraer mensaje del backend
      const serverMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        (err?.response?.data && typeof err.response.data === 'object'
          ? Object.values(err.response.data).flat().join(' ')
          : null);
      setError(serverMsg || 'No se pudo enviar la solicitud. Intenta nuevamente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        .fp-enter { animation: fpEnter 320ms ease both; }
        @keyframes fpEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .input-field { transition: box-shadow 160ms ease, transform 140ms ease, border-color 140ms ease; }
        .input-field:focus { outline: none; box-shadow: 0 6px 18px rgba(17,24,39,0.06); transform: translateY(-1px); border-color: rgba(17,24,39,0.08); }

        .btn-primary { transition: transform 160ms ease, box-shadow 160ms ease, opacity 120ms ease; }
        .btn-primary:active { transform: translateY(1px) scale(0.997); }
      `}</style>

      <div style={{ ...styles.container }} className={mounted ? 'fp-enter' : ''} aria-live="polite">
        <div style={styles.card}>
          <h2 style={styles.title}>Recuperar contraseña</h2>
          <p style={styles.subtitle}>Te enviaremos un correo con las instrucciones para restablecer tu contraseña.</p>

          <form onSubmit={submit} style={styles.form} noValidate>
            <label htmlFor="fp-email" style={styles.label}>Email</label>
            <input
              id="fp-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); setMsg(null); }}
              style={styles.input}
              className="input-field"
              placeholder="tu@correo.com"
              aria-describedby="fp-desc"
              required
              disabled={loading}
            />

            <div id="fp-desc" style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
              Te enviaremos un enlace seguro para restablecer tu contraseña.
            </div>

            {error && <div role="alert" style={styles.error}>{error}</div>}
            {msg && <div role="status" style={styles.success}>{msg}</div>}

            <button
              type="submit"
              className="btn-primary"
              style={{ ...styles.button, opacity: loading ? 0.85 : 1 }}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
          </form>

          <div style={styles.links}>
            <Link to="/login" style={styles.link}>Volver a iniciar sesión</Link>
            <Link to="/" style={styles.link}>Volver al Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- estilos ---------- */
const styles = {
  page: { minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', padding: 20, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' },
  container: { width: '100%', maxWidth: 480 },
  card: { background: '#fff', padding: 28, borderRadius: 12, boxShadow: '0 10px 30px rgba(2,6,23,0.06)', border: '1px solid rgba(15,23,42,0.03)' },
  title: { margin: 0, fontSize: 20 },
  subtitle: { marginTop: 8, color: '#6b7280', marginBottom: 12 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontWeight: 700, fontSize: 13 },
  input: { padding: 10, borderRadius: 8, border: '1px solid #e6e9ef', fontSize: 14, width: '100%' },
  button: { marginTop: 8, padding: 12, background: '#f59e0b', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800 },
  error: { marginTop: 8, color: '#b91c1c', background: '#fff1f2', padding: 10, borderRadius: 8 },
  success: { marginTop: 8, color: '#065f46', background: '#ecfdf5', padding: 10, borderRadius: 8 },
  links: { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' },
  link: { color: '#111827', textDecoration: 'none', fontWeight: 700 }
};
