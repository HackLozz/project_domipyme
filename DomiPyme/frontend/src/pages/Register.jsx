// src/pages/Register.jsx - Formulario de registro mejorado con validaciones
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../components/Api';
import { showToast } from '../components/Toast';
import './Register.css';

export default function Register() {
  const nav = useNavigate();
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'customer', // customer o merchant
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [pwdStrength, setPwdStrength] = useState(0);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState({});
  
  // Estados de validación visual
  const [fieldValid, setFieldValid] = useState({});
  const [pwdRequirements, setPwdRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 8);
    return () => clearTimeout(t);
  }, []);
  
  // Validación visual en tiempo real
  useEffect(() => {
    const validations = {};
    
    // Email
    if (form.email) {
      validations.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && !fieldErrors.email;
    }
    
    // Nombre
    if (form.first_name) {
      validations.first_name = form.first_name.trim().length >= 2 && /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(form.first_name.trim());
    }
    
    // Apellido
    if (form.last_name) {
      validations.last_name = form.last_name.trim().length >= 2 && /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(form.last_name.trim());
    }
    
    // Teléfono
    if (form.phone) {
      const cleanPhone = form.phone.replace(/[\s\-\(\)]/g, '');
      validations.phone = /^[0-9]{10,15}$/.test(cleanPhone) && !fieldErrors.phone;
    }
    
    // Confirmar contraseña
    if (form.passwordConfirm && form.password) {
      validations.passwordConfirm = form.password === form.passwordConfirm;
    }
    
    setFieldValid(validations);
  }, [form, fieldErrors]);
  
  // Validar requisitos de contraseña en tiempo real
  useEffect(() => {
    const pwd = form.password || '';
    setPwdRequirements({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
    });
  }, [form.password]);

  // Validación en tiempo real de email
  const validateEmailAvailability = async (email) => {
    if (!email || !email.includes('@')) return;
    
    setValidating(prev => ({ ...prev, email: true }));
    try {
      const response = await api.post('/auth/check-email/', { email });
      if (!response.data.available) {
        setFieldErrors(prev => ({ ...prev, email: response.data.message || 'Este email ya está registrado' }));
      } else {
        setFieldErrors(prev => {
          const { email, ...rest } = prev;
          return rest;
        });
      }
    } catch (err) {
      console.error('Error validando email:', err);
    } finally {
      setValidating(prev => ({ ...prev, email: false }));
    }
  };

  // Validación en tiempo real de teléfono
  const validatePhoneAvailability = async (phone) => {
    if (!phone || phone.length < 10) return;
    
    setValidating(prev => ({ ...prev, phone: true }));
    try {
      const response = await api.post('/auth/check-phone/', { phone });
      if (!response.data.available) {
        setFieldErrors(prev => ({ ...prev, phone: response.data.message || 'Este teléfono ya está registrado' }));
      } else {
        setFieldErrors(prev => {
          const { phone, ...rest } = prev;
          return rest;
        });
      }
    } catch (err) {
      console.error('Error validando teléfono:', err);
    } finally {
      setValidating(prev => ({ ...prev, phone: false }));
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setFieldErrors((prev) => {
      const { [name]: _, ...rest } = prev;
      return rest;
    });
    setError(null);
    setForm((prev) => ({ ...prev, [name]: value }));

    // Calcular fuerza de contraseña
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

  // Validación al perder foco (blur)
  const onBlur = (e) => {
    const { name, value } = e.target;
    
    if (name === 'email' && value.trim()) {
      validateEmailAvailability(value.trim());
    }
    
    if (name === 'phone' && value.trim()) {
      validatePhoneAvailability(value.trim());
    }
  };

  const validate = () => {
    const errors = {};
    const email = (form.email || '').trim();
    const pwd = form.password || '';
    const pwdConfirm = form.passwordConfirm || '';
    const phone = (form.phone || '').trim();

    // Validación de email
    if (!email) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email inválido';
    }

    // Validación de contraseña
    if (!pwd) {
      errors.password = 'La contraseña es requerida';
    } else if (pwd.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/[A-Z]/.test(pwd)) {
      errors.password = 'La contraseña debe contener al menos una mayúscula';
    } else if (!/[a-z]/.test(pwd)) {
      errors.password = 'La contraseña debe contener al menos una minúscula';
    } else if (!/[0-9]/.test(pwd)) {
      errors.password = 'La contraseña debe contener al menos un número';
    }

    // Validación de confirmación de contraseña
    if (!pwdConfirm) {
      errors.passwordConfirm = 'Confirma tu contraseña';
    } else if (pwd !== pwdConfirm) {
      errors.passwordConfirm = 'Las contraseñas no coinciden';
    }

    // Validación de nombre
    if (!form.first_name || form.first_name.trim().length < 2) {
      errors.first_name = 'El nombre debe tener al menos 2 caracteres';
    } else if (!/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(form.first_name.trim())) {
      errors.first_name = 'El nombre solo puede contener letras';
    }

    // Validación de apellido
    if (!form.last_name || form.last_name.trim().length < 2) {
      errors.last_name = 'El apellido debe tener al menos 2 caracteres';
    } else if (!/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/.test(form.last_name.trim())) {
      errors.last_name = 'El apellido solo puede contener letras';
    }

    // Validación de teléfono
    if (!phone) {
      errors.phone = 'El teléfono es requerido';
    } else if (!/^[0-9]{10,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Teléfono inválido (10-15 dígitos)';
    }

    return errors;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    
    // Validar formulario
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const el = document.querySelector(`[name="${firstKey}"]`);
      if (el) el.focus();
      showToast('Por favor corrige los errores del formulario', 'error');
      return;
    }

    setLoading(true);
    try {
      // Payload con todos los datos incluyendo rol y teléfono
      const payload = {
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        role: form.role,
      };

      // POST al endpoint de registro
      const resp = await api.post('/auth/register/', payload);

      if (resp && (resp.status === 201 || resp.status === 200)) {
        showToast('¡Registro exitoso! Ahora puedes iniciar sesión', 'success', 4000);
        setTimeout(() => {
          nav('/login', { replace: true });
        }, 1500);
      } else {
        showToast('Registro completado. Por favor inicia sesión', 'info');
        setTimeout(() => nav('/login'), 1500);
      }
    } catch (err) {
      console.error('Register error:', err);
      const resp = err?.response?.data;

      let errorMessage = 'Error al registrar. Por favor intenta nuevamente';

      if (resp) {
        if (typeof resp === 'object' && !Array.isArray(resp)) {
          const fl = {};
          
          // Procesar errores del backend
          if (resp.detail) {
            errorMessage = String(resp.detail);
            setError(errorMessage);
          }

          for (const k of Object.keys(resp)) {
            const v = resp[k];
            if (Array.isArray(v)) {
              fl[k] = v.join(' ');
            } else if (typeof v === 'object' && v !== null) {
              fl[k] = JSON.stringify(v);
            } else {
              fl[k] = String(v);
            }
          }

          // Mapear errores a campos del formulario
          const mapped = {};
          for (const key of Object.keys(fl)) {
            if (key === 'non_field_errors') {
              errorMessage = fl[key];
              setError(fl[key]);
            } else if (key === 'email' && fl[key].includes('already exists')) {
              mapped[key] = 'Este email ya está registrado';
            } else if (key === 'phone' && fl[key].includes('already exists')) {
              mapped[key] = 'Este teléfono ya está registrado';
            } else {
              mapped[key] = fl[key];
            }
          }

          if (Object.keys(mapped).length > 0) {
            setFieldErrors(mapped);
            if (!resp.detail) {
              errorMessage = Object.values(mapped)[0];
            }
          }
        } else if (Array.isArray(resp)) {
          errorMessage = String(resp[0] || errorMessage);
          setError(errorMessage);
        } else {
          errorMessage = String(resp);
          setError(errorMessage);
        }
      } else {
        errorMessage = err?.message || errorMessage;
        setError(errorMessage);
      }

      // Mostrar toast con el error
      showToast(errorMessage, 'error', 5000);
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
            {/* Selector de Tipo de Cuenta */}
            <div style={styles.field}>
              <label style={styles.label}>Tipo de Cuenta *</label>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <label style={{
                  ...styles.roleOption,
                  ...(form.role === 'customer' ? styles.roleOptionActive : {})
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="customer"
                    checked={form.role === 'customer'}
                    onChange={onChange}
                    disabled={loading}
                    style={{ marginRight: 8 }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Cliente</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Comprar productos</div>
                  </div>
                </label>

                <label style={{
                  ...styles.roleOption,
                  ...(form.role === 'merchant' ? styles.roleOptionActive : {})
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="merchant"
                    checked={form.role === 'merchant'}
                    onChange={onChange}
                    disabled={loading}
                    style={{ marginRight: 8 }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Comerciante</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Vender productos y gestionar tienda</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Nombre y Apellido */}
            <div style={styles.twoCols}>
              <div style={styles.field}>
                <label style={styles.label}>
                  Nombre *
                  {fieldValid.first_name && <span className="validation-success"> ✓</span>}
                </label>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={onChange}
                  style={styles.input}
                  className={`input-field ${fieldErrors.first_name ? 'form-input-error' : fieldValid.first_name ? 'form-input-success' : ''}`}
                  disabled={loading}
                  placeholder="Juan"
                  required
                  aria-invalid={!!fieldErrors.first_name}
                  aria-describedby={fieldErrors.first_name ? 'first_name-error' : undefined}
                />
                {fieldErrors.first_name && (
                  <small className="field-error" id="first_name-error" role="alert">
                    ⚠️ {fieldErrors.first_name}
                  </small>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Apellido *
                  {fieldValid.last_name && <span className="validation-success"> ✓</span>}
                </label>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={onChange}
                  style={styles.input}
                  className={`input-field ${fieldErrors.last_name ? 'form-input-error' : fieldValid.last_name ? 'form-input-success' : ''}`}
                  disabled={loading}
                  placeholder="Pérez"
                  required
                  aria-invalid={!!fieldErrors.last_name}
                  aria-describedby={fieldErrors.last_name ? 'last_name-error' : undefined}
                />
                {fieldErrors.last_name && (
                  <small className="field-error" id="last_name-error" role="alert">
                    ⚠️ {fieldErrors.last_name}
                  </small>
                )}
              </div>
            </div>

            {/* Email con validación en tiempo real */}
            <div style={styles.field}>
              <label style={styles.label}>
                Email *
                {fieldValid.email && <span className="validation-success"> ✓</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  className={`input-field ${fieldErrors.email ? 'form-input-error' : fieldValid.email ? 'form-input-success' : ''}`}
                  disabled={loading}
                  placeholder="tu@email.com"
                  required
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                {validating.email && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>
                    ⏳
                  </span>
                )}
              </div>
              {fieldErrors.email && (
                <small className="field-error" id="email-error" role="alert">
                  ⚠️ {fieldErrors.email}
                </small>
              )}
            </div>

            {/* Teléfono con validación en tiempo real */}
            <div style={styles.field}>
              <label style={styles.label}>
                Teléfono *
                {fieldValid.phone && <span className="validation-success"> ✓</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={onChange}
                  onBlur={onBlur}
                  style={styles.input}
                  className={`input-field ${fieldErrors.phone ? 'form-input-error' : fieldValid.phone ? 'form-input-success' : ''}`}
                  disabled={loading}
                  placeholder="3001234567"
                  required
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                />
                {validating.phone && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>
                    ⏳
                  </span>
                )}
              </div>
              <small style={styles.hint}>10-15 dígitos, sin espacios ni guiones</small>
              {fieldErrors.phone && (
                <small className="field-error" id="phone-error" role="alert">
                  ⚠️ {fieldErrors.phone}
                </small>
              )}
            </div>

            {/* Contraseña con checklist de requisitos */}
            <div style={styles.field}>
              <label style={styles.label}>Contraseña *</label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={onChange}
                  style={styles.input}
                  className={`input-field ${fieldErrors.password ? 'form-input-error' : ''}`}
                  disabled={loading}
                  placeholder="Mínimo 8 caracteres"
                  required
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby="password-requirements"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={styles.toggleBtn}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              
              {/* Checklist de requisitos */}
              {form.password && (
                <div className="password-requirements" id="password-requirements" style={{ marginTop: 8 }}>
                  <div style={styles.strengthBar}>
                    <div
                      className={`password-strength-fill ${pwdStrength <= 1 ? 'weak' : pwdStrength <= 2 ? 'medium' : 'strong'}`}
                      style={{
                        width: `${(pwdStrength / 4) * 100}%`,
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6, fontSize: 12 }}>
                    <div style={{ color: pwdRequirements.length ? '#10b981' : '#6b7280' }}>
                      {pwdRequirements.length ? '✓' : '○'} Mínimo 8 caracteres
                    </div>
                    <div style={{ color: pwdRequirements.uppercase ? '#10b981' : '#6b7280' }}>
                      {pwdRequirements.uppercase ? '✓' : '○'} Una mayúscula
                    </div>
                    <div style={{ color: pwdRequirements.lowercase ? '#10b981' : '#6b7280' }}>
                      {pwdRequirements.lowercase ? '✓' : '○'} Una minúscula
                    </div>
                    <div style={{ color: pwdRequirements.number ? '#10b981' : '#6b7280' }}>
                      {pwdRequirements.number ? '✓' : '○'} Un número
                    </div>
                  </div>
                </div>
              )}
              
              {fieldErrors.password && (
                <small className="field-error" role="alert">
                  ⚠️ {fieldErrors.password}
                </small>
              )}
            </div>

            {/* Confirmar Contraseña con toggle de visibilidad */}
            <div style={styles.field}>
              <label style={styles.label}>
                Confirmar Contraseña *
                {fieldValid.passwordConfirm && <span className="validation-success"> ✓</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  name="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  value={form.passwordConfirm}
                  onChange={onChange}
                  style={styles.input}
                  className={`input-field ${fieldErrors.passwordConfirm ? 'form-input-error' : fieldValid.passwordConfirm ? 'form-input-success' : ''}`}
                  disabled={loading}
                  placeholder="Repite tu contraseña"
                  required
                  aria-invalid={!!fieldErrors.passwordConfirm}
                  aria-describedby={fieldErrors.passwordConfirm ? 'passwordConfirm-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(p => !p)}
                  style={styles.toggleBtn}
                  aria-label={showPasswordConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPasswordConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.passwordConfirm && (
                <small className="field-error" id="passwordConfirm-error" role="alert">
                  ⚠️ {fieldErrors.passwordConfirm}
                </small>
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              <small style={styles.hint}>Al registrarte aceptas nuestros términos y condiciones.</small>
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
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                aria-busy={loading}
              >
                {loading && <span className="spinner-small" />}
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
  
  // Estilos para selector de rol
  roleOption: {
    flex: 1,
    padding: 12,
    border: '2px solid #e5e7eb',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleOptionActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  
  // Estilos para toggle de contraseña
  toggleBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 18,
    padding: 4,
  },
  
  // Estilos para barra de fortaleza de contraseña
  strengthBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s, background-color 0.3s',
  },
};
