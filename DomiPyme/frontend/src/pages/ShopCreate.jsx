// src/pages/ShopCreate.jsx
import React, { useEffect, useState, useRef } from 'react';
import api from '../components/Api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import './ShopCreate.css';

const slugify = (v = '') =>
  v
    .toString()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');

export default function ShopCreate() {
  const nav = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) nav('/login', { state: { from: '/shop/create' } });

    const t = setTimeout(() => setMounted(true), 8);
    return () => clearTimeout(t);
  }, [user, nav]);

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  // Validación de slug en tiempo real
  useEffect(() => {
    if (slug && !/^[a-z0-9-]{2,}$/.test(slug)) {
      setError('El slug solo puede contener minúsculas, números y guiones, mínimo 2 caracteres.');
    } else {
      setError(null);
    }
  }, [slug]);

  /** LOGO HANDLER */
  const onLogoChange = (file) => {
    setError(null);

    if (!file) {
      setLogoPreview(null);
      setLogoBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const max = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Solo se permiten imágenes PNG, JPG o WEBP.');
      return;
    }
    if (file.size > max) {
      setError('El logo supera el tamaño máximo de 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      setLogoBase64(ev.target.result); // base64 completo
    };
    reader.onerror = () => setError('No se pudo leer la imagen.');
    reader.readAsDataURL(file);
  };

  /** Sanitización básica para nombre y descripción */
  function sanitizeText(input) {
    if (!input) return '';
    return input.replace(/<[^>]*>?/gm, '').replace(/["'`]/g, '');
  }

  /** VALIDACIONES */
  const validate = () => {
    if (!name.trim()) return 'El nombre es requerido.';
    if (!slug.trim()) return 'El slug no puede estar vacío.';
    if (!/^[a-z0-9-]{2,}$/.test(slug)) return 'El slug solo puede contener minúsculas, números y guiones, mínimo 2 caracteres.';
    if (desc.length > 300) return 'La descripción no puede superar 300 caracteres.';
    return null;
  };

  /** SUBMIT HANDLER */
  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) return setError(v);

    const token = localStorage.getItem('access_token');
    if (!token)
      return nav('/login', { state: { from: '/shop/create' } });

    setLoading(true);

    try {
      const payload = {
        name: sanitizeText(name.trim()),
        description: sanitizeText(desc.trim()),
        slug: slugify(slug),
        address: address.trim(),
        phone: phone.trim(),
        image: logoBase64,
      };

      const res = await api.post('shops/', payload);

      let finalSlug = res?.data?.slug || payload.slug;

      if (!finalSlug) {
        setError("La tienda se creó, pero no se pudo obtener su URL. Verifica en administración.");
        return;
      }

      // REDIRECCIÓN DIRECTA A LA TIENDA
      nav(`/shop/${finalSlug}`);
    } catch (err) {
      console.error("Error creando tienda:", err);

      const msg =
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data) ||
        "Error creando la tienda.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page} className={mounted ? 'page-enter' : ''}>
      <style>{`
        .page-enter { animation: pageEnter 300ms ease both; }
        @keyframes pageEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ marginTop: 0 }}>Crear Tienda</h2>

          <form onSubmit={submit}>
            {/* NAME */}
            <div style={styles.field}>
              <label style={styles.label}>Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la tienda"
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* SLUG */}
            <div style={styles.field}>
              <label style={styles.label}>Slug</label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                placeholder="slug-de-mi-tienda"
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* DESC */}
            <div style={styles.field}>
              <label style={styles.label}>Descripción</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Descripción corta"
                style={{ ...styles.input, minHeight: 90 }}
                disabled={loading}
              />
            </div>

            {/* ADDRESS */}
            <div style={styles.field}>
              <label style={styles.label}>Dirección</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* PHONE */}
            <div style={styles.field}>
              <label style={styles.label}>Teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* LOGO */}
            <div style={styles.field}>
              <label style={styles.label}>Logo (opcional)</label>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={styles.uploadLabel}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) =>
                      onLogoChange(e.target.files?.[0] ?? null)
                    }
                    disabled={loading}
                  />
                  Subir logo
                </label>

                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="preview"
                    style={{
                      width: 96,
                      height: 64,
                      borderRadius: 8,
                      objectFit: 'cover',
                      border: '1px solid #ddd',
                    }}
                  />
                ) : (
                  <div style={styles.noLogo}>Sin logo</div>
                )}
              </div>
            </div>

            {/* ERROR */}
            {error && <div style={styles.errorBox}>{error}</div>}

            {/* BUTTONS */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="submit"
                disabled={loading}
                style={styles.btnPrimary}
              >
                {loading ? 'Creando...' : 'Crear tienda'}
              </button>

              <button
                type="button"
                onClick={() => nav('/catalog')}
                style={styles.btnSecondary}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/** ESTILOS */
const styles = {
  page: {
    padding: 20,
    display: 'flex',
    justifyContent: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  container: { width: '100%', maxWidth: 760 },
  card: {
    padding: 20,
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 6px 24px rgba(0,0,0,0.04)',
  },
  field: { marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontWeight: 700 },
  input: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #e5e7eb',
  },
  uploadLabel: {
    padding: '8px 12px',
    background: '#111827',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
  },
  noLogo: {
    width: 96,
    height: 64,
    background: '#f3f4f6',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
  },
  errorBox: {
    marginTop: 8,
    padding: 10,
    background: '#ef4444',
    color: '#fff',
    borderRadius: 8,
  },
  btnPrimary: {
    padding: '10px 14px',
    background: '#111827',
    color: '#fff',
    borderRadius: 10,
    cursor: 'pointer',
    border: 'none',
    fontWeight: 700,
  },
  btnSecondary: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: 10,
    cursor: 'pointer',
  },
};
