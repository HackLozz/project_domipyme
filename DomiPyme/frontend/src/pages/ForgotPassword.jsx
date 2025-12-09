// src/pages/ForgotPassword.jsx
import React, { useEffect, useRef, useState } from 'react';
import api from '../components/Api';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [mounted, setMounted] = useState(false);
  const isMountedRef = useRef(true);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugLink, setDebugLink] = useState(null);
  
  // Rate limiting: prevenir spam de solicitudes
  const [requestCount, setRequestCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  
  // Validación visual en tiempo real
  const [emailError, setEmailError] = useState('');
  const [emailValid, setEmailValid] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 8);
    return () => {
      clearTimeout(t);
      isMountedRef.current = false;
    };
  }, []);
  
  // Validar email en tiempo real
  useEffect(() => {
    if (!email) {
      setEmailError('');
      setEmailValid(false);
      return;
    }
    
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (re.test(email)) {
      setEmailError('');
      setEmailValid(true);
    } else {
      setEmailError('Formato de email inválido');
      setEmailValid(false);
    }
  }, [email]);
  
  // Cooldown timer para rate limiting
  useEffect(() => {
    if (cooldownTime <= 0) {
      setIsRateLimited(false);
      return;
    }
    
    const timer = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) {
          setIsRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [cooldownTime]);

  const validateEmail = (v) => {
    if (!v) return 'Ingresa tu email';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(v) ? null : 'Email inválido';
  };

  const extractServerMessage = (err) => {
    // Robust extraction: acepta string, {detail}, {error}, {field: [..]} y objetos mezclados
    try {
      if (!err) return null;
      if (typeof err === 'string') return err;

      const resp = err?.response;
      if (resp?.data) {
        const data = resp.data;
        if (typeof data === 'string') return data;
        if (data.detail) return data.detail;
        if (data.error) return data.error;
        // data puede ser { email: ["..."] } o { non_field_errors: ["..."] }
        if (typeof data === 'object') {
          const values = Object.values(data)
            .flat()
            .map((vv) => (typeof vv === 'string' ? vv : (Array.isArray(vv) ? vv.join(' ') : JSON.stringify(vv))));
          return values.join(' ').trim() || null;
        }
      }

      if (err?.request) {
        // No response (network)
        return 'No se recibió respuesta del servidor. Revisa tu conexión o intenta más tarde.';
      }

      return err?.message ?? 'Ocurrió un error inesperado.';
    } catch (e) {
      return 'Error procesando la respuesta del servidor.';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading || isRateLimited) return;

    // limpiar mensajes previos
    setMsg(null);
    setError(null);

    const raw = (email || '').trim();
    const v = validateEmail(raw);
    if (v) {
      setError(v);
      return;
    }
    
    // Rate limiting: máximo 3 solicitudes
    if (requestCount >= 3) {
      setIsRateLimited(true);
      setCooldownTime(60);
      setError('Has alcanzado el límite de solicitudes. Espera 60 segundos antes de intentar nuevamente.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('auth/password-reset-request/', { email: raw });

      if (isMountedRef.current) {
        setRequestCount(prev => prev + 1);
        const maybeLink = data?.debug_reset_url;
        setMsg(
          maybeLink
            ? 'Enlace de prueba generado abajo (solo dev). También se intentó enviar el correo.'
            : 'Si existe una cuenta con ese email, recibirás instrucciones por correo.'
        );
        setError(null);
        setDebugLink(maybeLink || null);
      }
    } catch (err) {
      console.error('ForgotPassword error:', err);

      const serverMsg = extractServerMessage(err);

      if (isMountedRef.current) {
        setError(serverMsg || 'No se pudo enviar la solicitud. Intenta nuevamente más tarde.');
        setMsg(null);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
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
            <label htmlFor="fp-email" style={styles.label}>
              Email
              {emailValid && <span className="validation-success"> ✓</span>}
            </label>
            <input
              id="fp-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); setMsg(null); }}
              style={styles.input}
              className={`input-field ${emailError ? 'form-input-error' : emailValid ? 'form-input-success' : ''}`}
              placeholder="tu@correo.com"
              aria-describedby="fp-desc"
              aria-invalid={!!emailError}
              required
              disabled={loading || isRateLimited}
            />
            
            {emailError && email && (
              <small className="field-error" role="alert">
                ⚠️ {emailError}
              </small>
            )}

            <div id="fp-desc" style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
              Te enviaremos un enlace seguro para restablecer tu contraseña.
            </div>
            
            {/* Rate limit warning */}
            {requestCount > 0 && requestCount < 3 && (
              <div className="warning-message" style={{ marginTop: 8 }}>
                📧 Has enviado {requestCount} de 3 solicitudes permitidas
              </div>
            )}
            
            {isRateLimited && (
              <div className="lockout-timer">
                <span className="lockout-icon">🔒</span>
                Límite alcanzado. Espera {cooldownTime}s para intentar nuevamente
              </div>
            )}

            {error && <div role="alert" style={styles.error}>{error}</div>}
            {msg && <div role="status" style={styles.success}>{msg}</div>}

            {debugLink && (
              <div style={styles.debugBox}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Enlace de depuración (dev):</div>
                <a href={debugLink} target="_blank" rel="noopener noreferrer" style={styles.debugLink}>{debugLink}</a>
              </div>
            )}

            <button
              type="submit"
              className={`btn-primary ${isRateLimited ? 'submit-button-locked' : ''}`}
              style={{ 
                ...styles.button, 
                opacity: (loading || isRateLimited) ? 0.85 : 1,
                cursor: (loading || isRateLimited) ? 'not-allowed' : 'pointer',
              }}
              disabled={loading || isRateLimited}
              aria-busy={loading}
            >
              {loading && <span className="spinner-small" />}
              {isRateLimited ? `Bloqueado (${cooldownTime}s)` : loading ? 'Enviando...' : 'Enviar instrucciones'}
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
  link: { color: '#111827', textDecoration: 'none', fontWeight: 700 },
  debugBox: { marginTop: 10, padding: 10, borderRadius: 8, background: '#f3f4f6', border: '1px dashed #d1d5db', wordBreak: 'break-all' },
  debugLink: { color: '#111827', fontWeight: 700, textDecoration: 'underline' }
};
