// src/pages/ResetPassword.jsx
import React, { useEffect, useState } from 'react';
import api from '../components/Api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const uidb64 = searchParams.get('uid');
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const nav = useNavigate();
  
  // Requisitos de contraseña en tiempo real
  const [pwdRequirements, setPwdRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });
  const [pwdStrength, setPwdStrength] = useState(0);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  
  // Token expiration warning (mostrar advertencia después de 10 min)
  const [tokenWarning, setTokenWarning] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 8);
    
    // Advertir después de 10 minutos que el token puede expirar
    const warningTimer = setTimeout(() => {
      setTokenWarning(true);
    }, 10 * 60 * 1000);
    
    return () => {
      clearTimeout(t);
      clearTimeout(warningTimer);
    };
  }, []);
  
  // Validar requisitos de contraseña en tiempo real
  useEffect(() => {
    const pwd = password || '';
    const reqs = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
    };
    setPwdRequirements(reqs);
    
    // Calcular fortaleza
    let score = 0;
    if (reqs.length) score += 1;
    if (reqs.uppercase) score += 1;
    if (reqs.lowercase) score += 1;
    if (reqs.number) score += 1;
    setPwdStrength(score);
  }, [password]);
  
  // Validar coincidencia de contraseñas
  useEffect(() => {
    if (confirmPassword && password) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(false);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    // Validar todos los requisitos
    if (!password || password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    
    if (!pwdRequirements.uppercase) {
      setError('La contraseña debe contener al menos una mayúscula.');
      return;
    }
    
    if (!pwdRequirements.lowercase) {
      setError('La contraseña debe contener al menos una minúscula.');
      return;
    }
    
    if (!pwdRequirements.number) {
      setError('La contraseña debe contener al menos un número.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const resp = await api.post('auth/password-reset-confirm/', {
        uidb64,
        token,
        new_password: password,
      });

      setMsg('✅ Contraseña cambiada correctamente. Redirigiendo al login...');
      setTimeout(() => nav('/login', { replace: true }), 2000);
    } catch (err) {
      const serverData = err?.response?.data;
      console.error('ResetPassword error:', {
        message: err?.message,
        status: err?.response?.status,
        data: serverData,
      });

      const serverMsg = serverData?.detail || serverData?.error || serverData || 'Error al restablecer contraseña.';
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
          
          {tokenWarning && !msg && (
            <div className="warning-message" style={{ marginBottom: 12 }}>
              ⚠️ Este enlace puede expirar pronto. Completa el proceso cuanto antes.
            </div>
          )}

          {msg && <div role="status" aria-live="polite" style={styles.success}>{msg}</div>}
          {error && <div role="alert" aria-live="assertive" style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            {/* Nueva contraseña con checklist */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="new-password">Nueva contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); setMsg(null); }}
                  className="input-field"
                  style={styles.input}
                  required
                  minLength={8}
                  disabled={loading}
                  aria-required="true"
                  autoFocus
                  aria-describedby="password-requirements"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                  }}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              
              {/* Checklist de requisitos */}
              {password && (
                <div className="password-requirements" id="password-requirements" style={{ marginTop: 8 }}>
                  <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                    <div
                      className={`password-strength-fill ${pwdStrength <= 1 ? 'weak' : pwdStrength <= 2 ? 'medium' : 'strong'}`}
                      style={{
                        width: `${(pwdStrength / 4) * 100}%`,
                        height: '100%',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12 }}>
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
            </div>
            
            {/* Confirmar contraseña */}
            <div style={styles.field}>
              <label style={styles.label} htmlFor="confirm-password">
                Confirmar contraseña
                {passwordsMatch && <span className="validation-success"> ✓</span>}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); setMsg(null); }}
                  className={`input-field ${confirmPassword && !passwordsMatch ? 'form-input-error' : passwordsMatch ? 'form-input-success' : ''}`}
                  style={styles.input}
                  required
                  disabled={loading}
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                  }}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <small className="field-error" role="alert">
                  ⚠️ Las contraseñas no coinciden
                </small>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ 
                ...styles.button, 
                opacity: (loading || pwdStrength < 4 || !passwordsMatch) ? 0.7 : 1,
                cursor: (loading || pwdStrength < 4 || !passwordsMatch) ? 'not-allowed' : 'pointer',
              }}
              disabled={loading || pwdStrength < 4 || !passwordsMatch}
              aria-busy={loading}
            >
              {loading && <span className="spinner-small" />}
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
