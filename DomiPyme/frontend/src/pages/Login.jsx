// src/pages/Login.jsx
/**
 * Página de Login
 * Implementa validaciones robustas, manejo de errores y redirección segura.
 * - Redirige automáticamente si el usuario ya está autenticado.
 * - Guarda la ruta original para volver tras login.
 * - Valida emails temporales y fuerza de contraseña.
 */
import React, { useEffect, useRef, useState } from 'react';
// Estructura para internacionalización (i18n)
// import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { showToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import './Login.css';

export default function Login() {
  // const { t } = useTranslation(); // Para i18n futuro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [captchaRequired, setCaptchaRequired] = useState(false); // Hook para CAPTCHA
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, answer: '' });
  const [captchaError, setCaptchaError] = useState(null);

  const isMountedRef = useRef(true);
  const nav = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    // animación de entrada ligera
    const t = setTimeout(() => setMounted(true), 8);
    isMountedRef.current = true;
    // Redirección automática si ya está autenticado
    if (auth.user) {
      nav(from, { replace: true });
    }
    return () => {
      clearTimeout(t);
      isMountedRef.current = false;
    };
  }, [auth.user, from, nav]);

  // Generar captcha matemático cuando se requiera
  useEffect(() => {
    if (captchaRequired) {
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      setCaptcha({ a, b, answer: '' });
      setCaptchaError(null);
    }
  }, [captchaRequired]);

  // Validación en tiempo real del email
  useEffect(() => {
    if (email && email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      // Validación extra: evitar emails temporales
      const tempDomains = ['mailinator.com', 'tempmail', '10minutemail', 'guerrillamail'];
      const domain = email.split('@')[1] || '';
      if (!emailRegex.test(email)) {
        setEmailError('Formato de email inválido');
      } else if (tempDomains.some(d => domain.includes(d))) {
        setEmailError('No se permiten emails temporales');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [email]);

  // Validación de contraseña mejorada (solo longitud mínima, feedback de seguridad)
  useEffect(() => {
    if (password && password.length > 0) {
      const minLength = 8;
      if (password.length < minLength) {
        setPasswordError('La contraseña debe tener al menos 8 caracteres');
      } else {
        setPasswordError('');
      }
    } else {
      setPasswordError('');
    }
  }, [password]);

  // Manejo de bloqueo temporal
  useEffect(() => {
    if (isLocked && lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  const submit = async (e) => {
    e.preventDefault();
    if (loading || isLocked) return;
    // Si requiere captcha, validar primero
    if (captchaRequired) {
      if (String(Number(captcha.answer)) !== String(captcha.a + captcha.b)) {
        setCaptchaError('Respuesta incorrecta');
        return;
      } else {
        setCaptchaRequired(false);
        setCaptchaError(null);
      }
    }
    // Validaciones previas
    if (!email || emailError) {
      setError('Ingrese un email válido');
      return;
    }
    if (!password || passwordError) {
      setError('Ingrese una contraseña válida');
      return;
    }
    setError(null);
    setEmailError('');
    setPasswordError('');
    setLoading(true);
    try {
      // Sugerencia: implementar bloqueo en backend y/o CAPTCHA
      // Si el backend responde con "captcha_required", activar el hook
      const userData = await auth.login(email.trim(), password, from, { remember });
      setFailedAttempts(0);
      showToast('¡Bienvenido de vuelta! 🎉', 'success', 3000);
      const currentPath = location.pathname;
      if (isMountedRef.current && currentPath !== from) {
        nav(from, { replace: true });
      }
    } catch (err) {
      let msg = 'Credenciales inválidas';
      let emailFieldError = '';
      let passwordFieldError = '';
      // Mejor gestión de errores de red y backend
      if (err?.response) {
        const status = err.response.status;
        if (status === 0) msg = 'No se pudo conectar al servidor. Verifique su conexión.';
        else if (status >= 500) msg = 'Error interno del servidor. Intente más tarde.';
        else if (err.response.data?.captcha_required) {
          setCaptchaRequired(true);
          msg = 'Demasiados intentos. Complete el CAPTCHA.';
        } else {
          const data = err.response.data;
          // Detectar errores específicos de campos
          if (data.email) {
            emailFieldError = typeof data.email === 'string' ? data.email : (Array.isArray(data.email) ? data.email.join(' ') : 'Email inválido');
            msg = emailFieldError;
          }
          if (data.password) {
            passwordFieldError = typeof data.password === 'string' ? data.password : (Array.isArray(data.password) ? data.password.join(' ') : 'Contraseña inválida');
            msg = passwordFieldError;
          }
          if (!emailFieldError && !passwordFieldError) {
            msg = data.detail || data.error || (typeof data === 'string' ? data : msg);
          }
        }
      } else if (err?.message) {
        msg = err.message;
      }
      if (isMountedRef.current) {
        // Feedback visual en campos
        if (emailFieldError) setEmailError(emailFieldError);
        if (passwordFieldError) setPasswordError(passwordFieldError);
        // Ya no bloqueamos el login por cuenta inactiva. Mostramos advertencia si el usuario no está verificado en el dashboard.
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= 5) {
          setIsLocked(true);
          setLockoutTime(60);
          setError('Demasiados intentos fallidos. Cuenta bloqueada temporalmente por 60 segundos.');
          showToast('Cuenta bloqueada temporalmente', 'error');
        } else {
          setError(`${msg}. Intentos restantes: ${5 - newAttempts}`);
          showToast(msg, 'error');
        }
        setLoading(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-page" role="main" aria-label="Página de inicio de sesión">
      <div className="login-card" aria-labelledby="login-title">
        <div className="login-header">
          <div className="login-logo" aria-hidden="true">🔐</div>
          <h2 className="login-title" id="login-title">Iniciar sesión</h2>
          <p className="login-subtitle" id="login-subtitle">Accede a tu cuenta para gestionar tiendas, pedidos y ventas.</p>
        </div>

        <form onSubmit={submit} className="login-form" aria-describedby="login-subtitle" role="form">
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="email">
              Email
              {email && !emailError && <span className="validation-success" aria-live="polite">✓</span>}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`form-input ${emailError ? 'form-input-error' : ''} ${email && !emailError ? 'form-input-success' : ''}`}
              required
              autoComplete="email"
              disabled={loading || isLocked}
              aria-required="true"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error' : 'email-hint'}
              placeholder="tu@email.com"
            />
            <span id="email-hint" className="visually-hidden">Introduce tu correo electrónico</span>
            {emailError && (
              <span id="email-error" className="field-error" role="alert" aria-live="assertive">
                ⚠️ {emailError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="password">
              Contraseña
              {password && !passwordError && <span className="validation-success" aria-live="polite">✓</span>}
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                name="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`form-input ${passwordError ? 'form-input-error' : ''} ${password && !passwordError ? 'form-input-success' : ''}`}
                required
                minLength={6}
                autoComplete="current-password"
                disabled={loading || isLocked}
                aria-required="true"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'password-error' : 'password-hint'}
                placeholder="••••••••"
              />
              <span id="password-hint" className="visually-hidden">Introduce tu contraseña</span>
              <span 
                className="input-icon" 
                onClick={() => !isLocked && setShowPw(v => !v)}
                role="button"
                tabIndex={0}
                aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPw ? '👁️' : '👁️‍🗨️'}
              </span>
            </div>
            {passwordError && (
              <span id="password-error" className="field-error" role="alert" aria-live="assertive">
                ⚠️ {passwordError}
              </span>
            )}
            {password && !passwordError && (
              <div className="password-strength" aria-live="polite">
                <div className="password-strength-bar">
                  <div 
                    className={`password-strength-fill ${password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak'}`}
                    style={{ width: `${Math.min((password.length / 12) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="password-strength-label">
                  {password.length >= 12 ? 'Fuerte 💪' : password.length >= 8 ? 'Media 👍' : 'Débil ⚠️'}
                </span>
              </div>
            )}
          </div>

          <div className="form-checkbox-wrapper">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={() => setRemember((v) => !v)}
              disabled={loading}
              className="form-checkbox"
              aria-checked={remember}
              aria-label="Recordar sesión"
            />
            <label htmlFor="remember" className="form-checkbox-label">
              Recordarme
              <span
                tabIndex={0}
                role="tooltip"
                aria-label="Si está activado, tu sesión se mantendrá iniciada en este dispositivo."
                style={{ marginLeft: 6, color: '#6b7280', fontSize: 12 }}
              >ℹ️</span>
            </label>
          </div>

          {error && (
            <div role="alert" className={`error-message ${isLocked ? 'error-locked' : ''}`} aria-live="assertive">
              <span>{isLocked ? '🔒' : '⚠️'}</span>
              <span>{error}</span>
            </div>
          )}

          {isLocked && lockoutTime > 0 && (
            <div className="lockout-timer" aria-live="polite">
              <span className="lockout-icon">⏱️</span>
              <span>Cuenta bloqueada. Reintenta en <strong>{lockoutTime}s</strong></span>
            </div>
          )}

          {failedAttempts > 0 && failedAttempts < 5 && !isLocked && (
            <div className="warning-message" aria-live="polite">
              <span>⚠️</span>
              <span>Intento {failedAttempts} de 5. Intenta de nuevo.</span>
            </div>
          )}

          <button
            type="submit"
            className={`submit-button ${isLocked ? 'submit-button-locked' : ''}`}
            disabled={loading || isLocked || !email || password.length < 6 || !!emailError || !!passwordError}
            aria-busy={loading}
            aria-label="Entrar al sistema"
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Validando...
              </>
            ) : isLocked ? (
              `🔒 Bloqueado (${lockoutTime}s)`
            ) : (
              'Entrar'
            )}
          </button>

          <div className="login-divider" aria-hidden="true">
            <span>o</span>
          </div>

          <div className="login-links">
            <Link to="/forgot-password" className="login-link">¿Olvidaste tu contraseña?</Link>
          </div>

          <div className="login-divider">
            <span></span>
          </div>

          <div className="login-links">
            ¿No tienes cuenta? <Link to="/register" className="login-link">Regístrate</Link>
          </div>

          <div className="login-divider">
            <span></span>
          </div>
          <div className="login-links">
            <Link to="/privacy" className="login-link">Política de privacidad</Link> |{' '}
            <Link to="/terms" className="login-link">Términos y condiciones</Link>
          </div>
        </form>

        {loading && (
          <div className="loading-overlay" role="status" aria-live="polite">
            <LoadingSpinner />
          </div>
        )}

        {/* Captcha matemático simple */}
        {captchaRequired && (
          <div className="captcha-container" role="alert" style={{marginTop:20, padding:16, background:'#fef3c7', border:'2px solid #fbbf24', borderRadius:10}}>
            <span>Por favor, resuelve el CAPTCHA para continuar.</span>
            <div style={{marginTop:12}}>
              <label htmlFor="captcha" style={{marginRight:8}}>
                ¿Cuánto es {captcha.a} + {captcha.b}?
              </label>
              <input
                id="captcha"
                name="captcha"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={captcha.answer}
                onChange={e => { setCaptchaError(null); setCaptcha(c => ({ ...c, answer: e.target.value })); }}
                style={{padding:8, borderRadius:6, border: captchaError ? '2px solid #dc2626' : '1px solid #ccc', width:80}}
                aria-label="Captcha"
                aria-invalid={!!captchaError}
                aria-describedby={captchaError ? 'captcha-error' : undefined}
                disabled={loading}
                placeholder="Respuesta"
              />
              <Button style={{marginLeft:8}} type="submit" disabled={loading || !captcha.answer}>
                Validar
              </Button>
            </div>
            {captchaError && (
              <div id="captcha-error" style={{fontSize:13, color:'#dc2626', marginTop:8}} role="alert">
                ⚠️ {captchaError}
              </div>
            )}
            <div style={{fontSize:12, color:'#92400e', marginTop:8}}>Este es un captcha simple. Para producción, considera Google reCAPTCHA.</div>
          </div>
        )}
      </div>
    </div>
  );
// Sugerencia: agregar pruebas automatizadas para Login.jsx usando Jest/Testing Library
// Ejemplo:
// import { render, screen, fireEvent } from '@testing-library/react';
// test('renderiza el formulario de login', () => { ... });
}
