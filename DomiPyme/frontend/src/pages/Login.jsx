// src/pages/Login.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { showToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import './Login.css';

export default function Login() {
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

  // Validación en tiempo real del email
  useEffect(() => {
    if (email && email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Formato de email inválido');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [email]);

  // Validación de contraseña
  useEffect(() => {
    if (password && password.length > 0) {
      if (password.length < 6) {
        setPasswordError('La contraseña debe tener al menos 6 caracteres');
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
      await auth.login(email.trim(), password, from, { remember });

      // Reset intentos fallidos en caso de éxito
      setFailedAttempts(0);
      showToast('¡Bienvenido de vuelta! 🎉', 'success', 3000);

      const currentPath = location.pathname;
      if (isMountedRef.current && currentPath !== from) {
        nav(from, { replace: true });
      }
    } catch (err) {
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
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        
        // Bloquear después de 5 intentos fallidos
        if (newAttempts >= 5) {
          setIsLocked(true);
          setLockoutTime(60); // 60 segundos de bloqueo
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
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🔐</div>
          <h2 className="login-title">Iniciar sesión</h2>
          <p className="login-subtitle">Accede a tu cuenta para gestionar tiendas, pedidos y ventas.</p>
        </div>

        <form onSubmit={submit} className="login-form">
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
            />
            <label htmlFor="remember" className="form-checkbox-label">
              Recordarme
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
        </form>

        {loading && (
          <div className="loading-overlay">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
}
