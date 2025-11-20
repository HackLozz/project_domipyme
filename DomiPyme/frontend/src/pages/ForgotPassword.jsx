// ForgotPassword.jsx
import React, { useState } from 'react';
import api from '../components/Api';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    try {
      // Ajusta endpoint según backend
      await api.post('auth/forgot-password/', { email });
      setMsg('Si existe una cuenta, recibirás un correo con instrucciones.');
    } catch (err) {
      setError('Error al solicitar recuperación');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Recuperar contraseña</h2>

        <form onSubmit={submit} style={styles.form}>
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} style={styles.input} />

          <button type="submit" style={styles.button}>Enviar instrucciones</button>
        </form>

        {msg && <div style={{ color: 'green', marginTop: 10 }}>{msg}</div>}
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}

        <div style={{ marginTop: 12 }}>
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 700 }}>Volver a iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f3f4f6' },
  card: { width: '100%', maxWidth: 420, background: '#fff', padding: 28, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  input: { padding: 10, borderRadius: 8, border: '1px solid #d1d5db' },
  button: { marginTop: 10, padding: 12, background: '#f59e0b', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: '700' }
};
