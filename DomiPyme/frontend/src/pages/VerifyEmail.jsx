// src/pages/VerifyEmail.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../components/Api';
import { showToast } from '../components/Toast';

export default function VerifyEmail() {
  const nav = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const email = location.state?.email || '';

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await api.post('/auth/verify-email-code/', { email, code });
      showToast('Correo verificado. Ahora puedes iniciar sesión.', 'success');
      setTimeout(() => nav('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div className="verify-email-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(15,23,42,0.10)', padding: 36, maxWidth: 400, width: '100%' }}>
        <h2 style={{ color: '#3b82f6', marginBottom: 12 }}>Verifica tu correo</h2>
        <p>Ingresa el código que te enviamos a <strong>{email}</strong> para activar tu cuenta.</p>
        <form onSubmit={submit} style={{ marginTop: 18 }}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Código de verificación"
            required
            style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '2px solid #e5e7eb', fontSize: 16, marginBottom: 12 }}
            disabled={loading}
          />
          {error && <div style={{ color: '#b91c1c', marginBottom: 10 }}>{error}</div>}
          <button type="submit" disabled={loading || !code} style={{ width: '100%', padding: '14px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
          ¿No recibiste el código? <button type="button" style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              await api.post('/auth/request-email-verification/', { email });
              showToast('Código reenviado al correo.', 'info');
            } catch {
              setError('No se pudo reenviar el código.');
            } finally {
              setLoading(false);
            }
          }}>Reenviar código</button>
        </div>
      </div>
    </div>
  );
}
