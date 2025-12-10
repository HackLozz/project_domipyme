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
    if (loading || isLocked || captchaRequired) return;
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
          msg = data.detail || data.error || (typeof data === 'string' ? data : msg);
        }
      } else if (err?.message) {
        msg = err.message;
      }
      if (isMountedRef.current) {
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
          <p className="login-subtitle">Accede a tu cuenta para gestionar tiendas, pedidos y ventas.</p>
        </div>

        <form onSubmit={submit} className="login-form" aria-describedby="login-subtitle">
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="email">
              Email
              {email && !emailError && <span className="validation-success">✓</span>}
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
              aria-describedby={emailError ? 'email-error' : undefined}
              placeholder="tu@email.com"
            />
            {emailError && (
              <span id="email-error" className="field-error" role="alert">
                ⚠️ {emailError}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="password">
              Contraseña
              {password && !passwordError && <span className="validation-success">✓</span>}
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
                aria-describedby={passwordError ? 'password-error' : undefined}
                placeholder="••••••••"
              />
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
              <span id="password-error" className="field-error" role="alert">
                ⚠️ {passwordError}
              </span>
            )}
            {password && !passwordError && (
              <div className="password-strength">
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
            <div role="alert" className={`error-message ${isLocked ? 'error-locked' : ''}`}>
              <span>{isLocked ? '🔒' : '⚠️'}</span>
              <span>{error}</span>
            </div>
          )}

          {isLocked && lockoutTime > 0 && (
            <div className="lockout-timer">
              <span className="lockout-icon">⏱️</span>
              <span>Cuenta bloqueada. Reintenta en <strong>{lockoutTime}s</strong></span>
            </div>
          )}

          {failedAttempts > 0 && failedAttempts < 5 && !isLocked && (
            <div className="warning-message">
              <span>⚠️</span>
              <span>Intento {failedAttempts} de 5. Intenta de nuevo.</span>
            </div>
          )}

          <button
            type="submit"
            className={`submit-button ${isLocked ? 'submit-button-locked' : ''}`}
            disabled={loading || isLocked || !email || password.length < 6 || !!emailError || !!passwordError}
            aria-busy={loading}
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

          <div className="login-divider">
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

        {/* Hook para CAPTCHA, sugerencia de integración */}
        {captchaRequired && (
          <div className="captcha-container" role="alert" style={{marginTop:20, padding:16, background:'#fef3c7', border:'2px solid #fbbf24', borderRadius:10}}>
            <span>Por favor, completa el CAPTCHA para continuar.</span>
            {/* Ejemplo de integración: */}
            <div style={{marginTop:12}}>
              <input type="text" placeholder="Escribe '1234' para continuar" aria-label="Captcha" style={{padding:8, borderRadius:6, border:'1px solid #ccc'}} />
              <Button style={{marginLeft:8}} onClick={()=>setCaptchaRequired(false)}>Validar</Button>
            </div>
            <div style={{fontSize:12, color:'#92400e', marginTop:8}}>Este es un ejemplo de CAPTCHA. Integra Google reCAPTCHA para producción.</div>
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
