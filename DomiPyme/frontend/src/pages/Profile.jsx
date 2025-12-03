// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import api from '../components/Api';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const nav = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  if (!user) {
    return <div style={{ padding: 20 }}>Necesitas iniciar sesión para ver tu perfil.</div>;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await api.put('auth/me/', form);
      if (updateUser && typeof updateUser === 'function') {
        updateUser(res.data);
      }
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
      const msg = err?.response?.data?.detail || err?.message || 'Error actualizando perfil';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setError(null);
  };

  return (
    <div style={styles.container} className={mounted ? 'page-enter' : ''}>
      <style>{`
        .page-enter { animation: pageEnter 320ms ease both; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .input-field { transition: box-shadow 160ms ease, transform 140ms ease, border-color 140ms ease; }
        .input-field:focus { outline: none; box-shadow: 0 6px 18px rgba(17,24,39,0.06); transform: translateY(-1px); border-color: rgba(17,24,39,0.08); }

        .btn { transition: transform 160ms ease, box-shadow 160ms ease, opacity 140ms ease; }
        .btn:active { transform: translateY(1px) scale(0.997); }
      `}</style>

      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.h2}>Mi perfil</h2>
            <p style={styles.subtitle}>Gestiona tu información personal y preferencias</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} style={styles.btnEdit} className="btn">
              Editar
            </button>
          )}
        </div>

        {success && (
          <div style={styles.successBox}>
            ✓ Perfil actualizado correctamente
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Nombre</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                disabled={!editing || loading}
                style={styles.input}
                className="input-field"
                required
              />
            </div>

            <div>
              <label style={styles.label}>Apellido</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                disabled={!editing || loading}
                style={styles.input}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={!editing || loading}
              style={styles.input}
              className="input-field"
              required
            />
          </div>

          <div>
            <label style={styles.label}>Teléfono</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              disabled={!editing || loading}
              style={styles.input}
              className="input-field"
              placeholder="Opcional"
            />
          </div>

          <div style={styles.info}>
            <div><strong>Rol:</strong> {user.role || 'customer'}</div>
            <div><strong>Usuario desde:</strong> {user.date_joined ? new Date(user.date_joined).toLocaleDateString('es-CO') : 'N/A'}</div>
          </div>

          {editing && (
            <div style={styles.actions}>
              <button type="submit" disabled={loading} style={styles.btnPrimary} className="btn">
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={handleCancel} disabled={loading} style={styles.btnSecondary} className="btn">
                Cancelar
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    maxWidth: 700,
    margin: '0 auto',
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 6px 24px rgba(2,6,23,0.06)',
    border: '1px solid rgba(15,23,42,0.03)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  h2: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: '#111827',
  },
  subtitle: {
    margin: '4px 0 0',
    color: '#6b7280',
    fontSize: 14,
  },
  btnEdit: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(17,24,39,0.1)',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer',
    color: '#111827',
  },
  successBox: {
    padding: 12,
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: 8,
    marginBottom: 16,
    fontWeight: 600,
  },
  errorBox: {
    padding: 12,
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 8,
    marginBottom: 16,
    fontWeight: 600,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontWeight: 700,
    fontSize: 13,
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    fontSize: 14,
  },
  info: {
    padding: 12,
    background: '#f9fafb',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    color: '#4b5563',
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
  },
  btnPrimary: {
    padding: '10px 20px',
    background: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer',
    flex: 1,
  },
  btnSecondary: {
    padding: '10px 20px',
    background: 'transparent',
    border: '1px solid rgba(17,24,39,0.1)',
    color: '#111827',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer',
  },
};
