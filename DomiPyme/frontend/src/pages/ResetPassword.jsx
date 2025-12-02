// src/pages/ResetPassword.jsx
import React, { useEffect, useState } from 'react';
import api from '../components/Api';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const uidb64 = searchParams.get('uid');    // uid codificado en base64 (uidb64)
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 8);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (!password || password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // Enviamos 'uidb64', 'token' y 'new_password' como espera el backend
      const resp = await api.post('auth/password-reset-confirm/', {
        uidb64,
        token,
        new_password: password,
      });

      // Mostrar mensaje y redirigir (replace evita volver con back)
      setMsg('Contraseña cambiada correctamente. Serás redirigido al login.');
      setTimeout(() => nav('/login', { replace: true }), 2000);
    } catch (err) {
      // Mejor trazabilidad en consola y en UI
      const serverData = err?.response?.data;
      console.error('ResetPassword error:', {
        message: err?.message,
        status: err?.response?.status,
        data: serverData,
      });

      // Prioriza mensajes detallados enviados por el servidor
      const serverMsg = serverData?.detail || serverData?.error || serverData || 'Error al restablecer contraseña.';
      // Si serverMsg es objeto, intentar extraer un string legible
      const finalMsg = typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg);
      setError(finalMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!uidb64 || !token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.alertWarning}>Enlace inválido. Revisa el correo y vuelve a intentarlo.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        .rp-enter { animation: rpEnter 320ms ease both; }
        @keyframes rpEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .input-field { transition: box-shadow 160ms ease, transform 140ms ease, border-color 140ms ease; }
        .input-field:focus { outline: none; box-shadow: 0 6px 18px rgba(17,24,39,0.06); transform: translateY(-1px); border-color: rgba(17,24,39,0.08); }

        .btn-primary { transition: transform 160ms ease, box-shadow 160ms ease, opacity 120ms ease; }
        .btn-primary:active { transform: translateY(1px) scale(0.997); }
      `}</style>

      <div style={{ ...styles.container }} className={mounted ? 'rp-enter' : ''}>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Restablecer contraseña</h3>

          {msg && <div role="status" aria-live="polite" style={styles.success}>{msg}</div>}
          {error && <div role="alert" aria-live="assertive" style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="new-password">Nueva contraseña</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); setMsg(null); }}
                className="input-field"
                style={styles.input}
                required
                minLength={8}
                disabled={loading}
                aria-required="true"
                autoFocus
                aria-describedby="pw-hint"
              />
              <small id="pw-hint" style={styles.hint}>Mínimo 8 caracteres.</small>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ ...styles.button, opacity: (loading || password.length < 8) ? 0.85 : 1 }}
              disabled={loading || password.length < 8}
              aria-busy={loading}
            >
              {loading ? 'Procesando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', padding: 20, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' },
  container: { width: '100%', maxWidth: 520 },
  card: { background: '#fff', padding: 22, borderRadius: 12, boxShadow: '0 10px 30px rgba(2,6,23,0.06)', border: '1px solid rgba(15,23,42,0.03)' },
  form: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontWeight: 700, fontSize: 13 },
  input: { padding: 10, borderRadius: 8, border: '1px solid #e6e9ef', fontSize: 14, width: '100%' },
  hint: { color: '#6b7280', fontSize: 12 },
  button: { marginTop: 6, padding: 12, background: '#111827', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800 },
  error: { marginTop: 8, color: '#b91c1c', background: '#fff1f2', padding: 10, borderRadius: 8 },
  success: { marginTop: 8, color: '#065f46', background: '#ecfdf5', padding: 10, borderRadius: 8 },
  alertWarning: { padding: 12, borderRadius: 8, background: '#fffbeb', color: '#92400e', border: '1px solid rgba(245,158,11,0.12)' }
};
