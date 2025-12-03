// src/pages/Register.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../components/Api';

export default function Register() {
  const nav = useNavigate();
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    first_name: '',
    last_name: '',
    username: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [pwdStrength, setPwdStrength] = useState(0);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 8);
    return () => clearTimeout(t);
  }, []);

  // Autogenerar username si el usuario no lo edita (no cambia estilos)
  useEffect(() => {
    if (!form.username) {
      const namePart = (form.first_name || form.email || '').split(' ')[0] || '';
      const generated = (namePart || (form.email || '').split('@')[0] || '')
        .toLowerCase()
        .replace(/[^\w\d_-]/g, '');
      // solo actualizar si es distinto para evitar renders infinitos
      if (generated && generated !== form.username) {
        setForm((f) => ({ ...f, username: generated }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.first_name, form.email]);

  const onChange = (e) => {
    // normalizar nombre de campo (backend usa first_name, last_name, email, password)
    const { name, value } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: undefined })); // borrar error de campo específico
    setError(null);
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      const v = value || '';
      let score = 0;
      if (v.length >= 8) score += 1;
      if (/[A-Z]/.test(v)) score += 1;
      if (/[a-z]/.test(v)) score += 1;
      if (/[0-9]/.test(v)) score += 1;
      if (/[^A-Za-z0-9]/.test(v)) score += 1;
      setPwdStrength(score);
    }
  };

  const validate = () => {
    const errors = {};
    const email = (form.email || '').trim();
    const pwd = form.password || '';
    const pwdConfirm = form.passwordConfirm || '';

    if (!email || !email.includes('@')) errors.email = 'Email inválido';
    if (!pwd || pwd.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres';
    if (pwd !== pwdConfirm) errors.passwordConfirm = 'Las contraseñas no coinciden';
    if (!form.first_name || form.first_name.trim().length < 2) errors.first_name = 'Nombre muy corto';
    if (!form.last_name || form.last_name.trim().length < 2) errors.last_name = 'Apellido muy corto';

    return errors;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      // foco en primer error visible
      const firstKey = Object.keys(errs)[0];
      const el = document.querySelector(`[name="${firstKey}"]`);
      if (el) el.focus();
      return;
    }

    setLoading(true);
    try {
      // Payload mínimo que backend espera (evitamos enviar campos no soportados)
      const payload = {
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      };

      // POST al endpoint de registro
      const resp = await api.post('auth/register/', payload);

      // Si respuesta ok (201/200) redirigimos al login
      // Comportamiento: redirigir sólo si la respuesta es exitosa
      if (resp && (resp.status === 201 || resp.status === 200)) {
        nav('/login', { replace: true });
      } else {
        // fallback: si servidor devolvió algo inesperado, mostrar mensaje genérico
        setError('Registro completado (respuesta inesperada). Por favor inicia sesión.');
      }
    } catch (err) {
      console.error('Register error:', err);
      const resp = err?.response?.data;

      // Manejo robusto de errores DRF
      if (resp) {
        // Caso: resp es object con campos -> mapear a fieldErrors
        if (typeof resp === 'object' && !Array.isArray(resp)) {
          const fl = {};
          // drf puede retornar 'non_field_errors' o 'detail'
          if (resp.detail) {
            setError(String(resp.detail));
          }
          for (const k of Object.keys(resp)) {
            const v = resp[k];
            // normalizar a string
            if (Array.isArray(v)) {
              fl[k] = v.join(' ');
            } else if (typeof v === 'object' && v !== null) {
              // por si vienen dicts anidados
              fl[k] = JSON.stringify(v);
            } else {
              fl[k] = String(v);
            }
          }

          // Mapear claves de backend a nombres de campos del formulario si es necesario
          const mapped = {};
          for (const key of Object.keys(fl)) {
            // ejemplos: email -> email, non_field_errors -> error general, password -> password
            if (key === 'non_field_errors') {
              setError(fl[key]);
            } else {
              mapped[key] = fl[key];
            }
          }

          // Actualizar errores por campo y mensaje general si no hay detail
          if (!error && Object.keys(mapped).length > 0) {
            // si hay errores de email/pwd mostrarlos en UI
            setFieldErrors((prev) => ({ ...prev, ...mapped }));
            if (!error) {
              const first = Object.values(mapped)[0];
              setError(String(first));
            }
          }
        } else if (Array.isArray(resp)) {
          // array de errores -> mostrar el primero
          setError(String(resp[0] || 'Error en el registro'));
        } else {
          setError(String(resp));
        }
      } else {
        setError(err?.message || 'Error en el registro');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .register-enter { animation: regEnter 320ms ease both; }
        @keyframes regEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .input-field { transition: box-shadow 160ms ease, transform 140ms ease, border-color 140ms ease; }
        .input-field:focus { outline: none; box-shadow: 0 6px 18px rgba(17,24,39,0.06); transform: translateY(-1px); border-color: rgba(17,24,39,0.08); }

        .btn-primary { transition: transform 160ms ease, box-shadow 160ms ease, opacity 120ms ease; }
        .btn-primary:active { transform: translateY(1px) scale(0.997); }
      `}</style>

      <div style={{ ...styles.cardWrap, ...(mounted ? {} : { opacity: 0 }) }} className="register-enter" aria-live="polite">
        <div style={styles.card}>
          <h2 style={styles.title}>Crear cuenta</h2>
          <p style={{ marginTop: 0, color: '#6b7280' }}>Regístrate para gestionar tiendas, productos y pedidos.</p>

          <form onSubmit={submit} style={styles.form} noValidate>
            <div style={styles.twoCols}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre</label>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={onChange}
                  style={styles.input}
                  className="input-field"
                  disabled={loading}
                />
                {fieldErrors.first_name && <small style={styles.errField}>{fieldErrors.first_name}</small>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Apellido</label>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={onChange}
                  style={styles.input}
                  className="input-field"
                  disabled={loading}
                />
                {fieldErrors.last_name && <small style={styles.errField}>{fieldErrors.last_name}</small>}
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Usuario (opcional)</label>
              <input
                name="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                style={styles.input}
                className="input-field"
                disabled={loading}
                aria-describedby="username-hint"
              />
              <small id="username-hint" style={styles.hint}>Se usará en tu URL pública (puedes cambiarlo luego).</small>
              {fieldErrors.username && <small style={styles.errField}>{fieldErrors.username}</small>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                style={styles.input}
                className="input-field"
                disabled={loading}
                required
              />
              {fieldErrors.email && <small style={styles.errField}>{fieldErrors.email}</small>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Teléfono</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                style={styles.input}
                className="input-field"
                disabled={loading}
              />
              {fieldErrors.phone && <small style={styles.errField}>{fieldErrors.phone}</small>}
            </div>

            <div style={styles.twoCols}>
              <div style={styles.field}>
                <label style={styles.label}>Contraseña</label>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={onChange}
                  style={styles.input}
                  className="input-field"
                  disabled={loading}
                  minLength={8}
                  required
                />
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 8, borderRadius: 6, background: '#eef2f7', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(pwdStrength/5)*100}%`, background: pwdStrength>=4? '#10b981' : (pwdStrength>=3? '#f59e0b':'#ef4444') }} />
                  </div>
                  <small style={styles.hint}>{pwdStrength>=4? 'Fuerte' : pwdStrength>=3? 'Media' : 'Débil'}</small>
                </div>
                {fieldErrors.password && <small style={styles.errField}>{fieldErrors.password}</small>}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Confirmar contraseña</label>
                <input
                  name="passwordConfirm"
                  type={showPassword ? 'text' : 'password'}
                  value={form.passwordConfirm}
                  onChange={onChange}
                  style={styles.input}
                  className="input-field"
                  disabled={loading}
                  minLength={8}
                  required
                />
                {fieldErrors.passwordConfirm && <small style={styles.errField}>{fieldErrors.passwordConfirm}</small>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={showPassword} onChange={() => setShowPassword((s) => !s)} disabled={loading} />
                Mostrar contraseña
              </label>

              <small style={styles.hint}>Al registrarte aceptas los términos.</small>
            </div>

            {error && <div role="alert" style={styles.errorBox}>{error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  ...styles.button,
                  opacity: loading ? 0.85 : 1,
                }}
              >
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </button>

              <Link to="/login" style={styles.ghost}>¿Ya tienes cuenta? Entrar</Link>
            </div>
          </form>

          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <Link to="/" style={styles.link}>Volver al Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- estilos ---------- */
const styles = {
  container: { minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', padding: 20, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' },
  cardWrap: { width: '100%', maxWidth: 720 },
  card: { background: '#fff', padding: 28, borderRadius: 12, boxShadow: '0 10px 30px rgba(2,6,23,0.06)', border: '1px solid rgba(15,23,42,0.03)' },
  title: { margin: 0, fontSize: 20 },
  subtitle: { marginTop: 6, color: '#6b7280' },
  form: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 },
  twoCols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontWeight: 700, fontSize: 13 },
  input: { padding: 10, borderRadius: 8, border: '1px solid #e6e9ef', fontSize: 14, width: '100%' },
  hint: { color: '#6b7280', fontSize: 12 },
  button: { padding: 12, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 800 },
  ghost: { padding: '10px 12px', textDecoration: 'none', borderRadius: 8, border: '1px solid rgba(17,24,39,0.06)', color: '#111827', fontWeight: 700 },
  link: { color: '#111827', textDecoration: 'none', fontWeight: 700 },
  errorBox: { marginTop: 8, color: '#b91c1c', background: '#fff1f2', padding: 10, borderRadius: 8 },
  errField: { color: '#b91c1c', fontSize: 12 },
};
