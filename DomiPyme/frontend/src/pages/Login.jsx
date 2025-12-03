// src/pages/Login.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const isMountedRef = useRef(true);
  const nav = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    // animación de entrada ligera
    const t = setTimeout(() => setMounted(true), 8);

    // marcar mounted para evitar setState luego del unmount
    isMountedRef.current = true;
    return () => {
      clearTimeout(t);
      isMountedRef.current = false;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!email) {
      setError('Ingrese un email válido');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Usa la función login del contexto (evita duplicar peticiones)
      // Conservé la firma que usabas: auth.login(email, password, from, { remember })
      await auth.login(email.trim(), password, from, { remember });

      // Si auth.login no se encarga de redirigir, haremos la navegación aquí.
      // Evitamos navegar si ya estamos en la ruta destino para no crear loops.
      const currentPath = location.pathname;
      if (isMountedRef.current && currentPath !== from) {
        nav(from, { replace: true });
      }
      // Si auth.login ya redirigió, la navegación será ignorada (no causa error).
    } catch (err) {
      // intenta obtener un mensaje de error del servidor si existe (defensivo)
      let msg = 'Credenciales inválidas';
      try {
        if (err?.response?.data) {
          const data = err.response.data;
          msg =
            data.detail ||
            data.error ||
            (typeof data === 'string' ? data : msg);
        } else if (err?.message) {
          msg = err.message;
        }
      } catch (parseErr) {
        // si algo falla al parsear, mantenemos mensaje por defecto
      }

      if (isMountedRef.current) {
        setError(msg);
        setLoading(false);
      }
    } finally {
      // Solo actualizar loading si el componente sigue montado
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        /* entrada de página / card */
        .login-enter { animation: loginEnter 320ms ease both; }
        @keyframes loginEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* microinteracciones */
        .input-field { transition: box-shadow 160ms ease, transform 140ms ease, border-color 140ms ease; }
        .input-field:focus { outline: none; box-shadow: 0 6px 18px rgba(17,24,39,0.06); transform: translateY(-1px); border-color: rgba(17,24,39,0.08); }

        .btn-primary { transition: transform 160ms ease, box-shadow 160ms ease, opacity 140ms ease; }
        .btn-primary:active { transform: translateY(1px) scale(0.997); }

        .small-link { transition: color 120ms ease, transform 120ms ease; }
        .small-link:hover { transform: translateY(-2px); }
      `}</style>

      <div style={{ ...styles.cardWrap, ...(mounted ? {} : { opacity: 0 }) }} className="login-enter" aria-live="polite">
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h2 style={styles.title}>Iniciar sesión</h2>
              <p style={styles.subtitle}>Accede a tu cuenta para gestionar tiendas, pedidos y ventas.</p>
            </div>
          </div>

          <form onSubmit={submit} style={styles.form} aria-describedby="login-desc">
            <label style={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              className="input-field"
              required
              autoComplete="email"
              disabled={loading}
              aria-required="true"
            />

            <label style={styles.label} htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input}
              className="input-field"
              required
              minLength={6}
              autoComplete="current-password"
              disabled={loading}
              aria-required="true"
            />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <input type="checkbox" checked={showPw} onChange={() => setShowPw(v=>!v)} disabled={loading} />
              Mostrar contraseña
            </label>

            <div style={styles.row}>
              <label style={styles.remember}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember((v) => !v)}
                  disabled={loading}
                />{' '}
                Recordarme
              </label>

              <Link to="/forgot-password" style={styles.smallLink}>¿Olvidaste tu contraseña?</Link>
            </div>

            {error && <div role="alert" style={styles.error}>{error}</div>}

            <button
              type="submit"
              className="btn-primary"
              style={{ ...styles.button, opacity: loading ? 0.85 : 1 }}
              disabled={loading || !email || password.length < 6}
              aria-busy={loading}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <defs>
                      <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
                        <stop stopColor="#fff" stopOpacity="0" offset="0%"/>
                        <stop stopColor="#fff" stopOpacity=".631" offset="63.146%"/>
                        <stop stopColor="#fff" offset="100%"/>
                      </linearGradient>
                    </defs>
                    <g fill="none" fillRule="evenodd">
                      <g transform="translate(1 1)">
                        <path d="M36 18c0-9.94-8.06-18-18-18" stroke="rgba(255,255,255,0.35)" strokeWidth="2">
                          <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="0.9s" repeatCount="indefinite"/>
                        </path>
                        <path d="M36 18c0-9.94-8.06-18-18-18" stroke="url(#a)" strokeWidth="2">
                          <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="0.9s" repeatCount="indefinite"/>
                        </path>
                      </g>
                    </g>
                  </svg>
                  Validando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div style={styles.links}>
            <Link to="/register" style={styles.link}>¿No tienes cuenta? Regístrate</Link>
            <Link to="/" style={styles.link}>Volver al Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- estilos ---------- */
const styles = {
  container: {
    minHeight: '80vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f8fafc',
    padding: 20,
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'
  },
  cardWrap: { width: '100%', maxWidth: 460, margin: '0 auto' },
  card: {
    background: '#fff',
    padding: 28,
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(2,6,23,0.06)',
    border: '1px solid rgba(15,23,42,0.03)'
  },
  header: { marginBottom: 6 },
  title: { margin: 0, fontSize: 22 },
  subtitle: { marginTop: 6, color: '#6b7280' },
  form: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 },
  label: { fontWeight: 700, fontSize: 13 },
  input: { padding: 10, borderRadius: 8, border: '1px solid #e6e9ef', fontSize: 14, width: '100%' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  remember: { display: 'inline-flex', alignItems: 'center', gap: 8, color: '#374151' },
  button: {
    marginTop: 6,
    padding: 12,
    background: '#111827',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  error: { color: '#b91c1c', background: '#fff1f2', padding: 10, borderRadius: 8, marginTop: 6 },
  links: { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center' },
  link: { color: '#111827', textDecoration: 'none', fontWeight: 700 }
};
