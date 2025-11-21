// src/pages/ShopCreate.jsx
import React, { useEffect, useState } from 'react';
import api from '../components/Api';
import { useNavigate } from 'react-router-dom';

/**
 * ShopCreate.jsx
 * - Diseño coherente: tarjeta blanca, sombras, inputs con micro-interacción
 * - Animaciones: entrada de página, focus en inputs, botón con feedback
 * - Genera slug automáticamente desde el nombre, editable
 * - Permite subir un logo (preview) y lo convierte a base64 para enviar en payload
 * - Validaciones básicas y manejo de errores/loading
 */

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

  // form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    // animación de entrada
    const t = setTimeout(() => setMounted(true), 8);
    return () => clearTimeout(t);
  }, []);

  // generar slug automáticamente cuando cambie el nombre, si el usuario no lo editó manualmente
  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugify(name));
    }
  }, [name, slugEdited]);

  // manejar preview y conversión a base64 del logo
  const onLogoChange = (file) => {
    setLogoFile(file);
    setError(null);

    if (!file) {
      setLogoPreview(null);
      setLogoBase64(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      // ev.target.result es base64 data url
      setLogoBase64(ev.target.result);
    };
    reader.onerror = () => {
      setError('No se pudo leer el archivo de logo.');
      setLogoPreview(null);
      setLogoBase64(null);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (!name || name.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.';
    if (!slug || slug.trim().length < 2) return 'El slug no puede estar vacío.';
    // opcional: validación de descripción
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      // payload: si tu backend espera multipart/form-data, cambia por FormData
      const payload = {
        name: name.trim(),
        description: desc.trim(),
        slug: slugify(slug),
        image: logoBase64, // base64 data url (opcional); adapta si necesitas FormData
      };

      const res = await api.post('shops/', payload);

      const resSlug = res.data?.slug ?? res.data?.id ?? payload.slug;
      // navegar a la tienda creada
      nav(`/shop/${resSlug}`);
    } catch (err) {
      console.error('Error creando tienda:', err);
      // mensaje amigable si backend responde con detalle
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.slug?.[0] ||
        'Error creando la tienda. Revisa la consola.';
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

        .card-enter { animation: cardEnter 360ms cubic-bezier(.2,.9,.2,1) both; }
        @keyframes cardEnter { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }

        .input-field { transition: box-shadow 160ms ease, transform 140ms ease; }
        .input-field:focus { outline: none; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(17,24,39,0.06); }

        .btn-primary { transition: transform 160ms ease, opacity 140ms ease; }
        .btn-primary:active { transform: translateY(1px) scale(0.997); }
      `}</style>

      <div style={styles.container}>
        <div style={{ ...styles.card, ...(mounted ? {} : { opacity: 0 }) }} className="card-enter">
          <h2 style={{ marginTop: 0 }}>Crear Tienda</h2>

          <form onSubmit={submit}>
            <div style={styles.field}>
              <label style={styles.label}>Nombre</label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la tienda"
                style={styles.input}
                disabled={loading}
              />
              <small style={styles.hint}>El nombre será visible públicamente.</small>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Slug (URL)</label>
              <input
                className="input-field"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                placeholder="slug-de-mi-tienda"
                style={styles.input}
                disabled={loading}
              />
              <small style={styles.hint}>Será usado en la URL: /shop/&lt;slug&gt;</small>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Descripción</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Descripción corta de la tienda"
                style={{ ...styles.input, minHeight: 96, resize: 'vertical' }}
                disabled={loading}
              />
              <div style={styles.rowBetween}>
                <small style={styles.hint}>Máx. 300 caracteres</small>
                <small style={{ color: desc.length > 300 ? '#ef4444' : '#6b7280' }}>
                  {desc.length}/300
                </small>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Logo (opcional)</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={styles.uploadLabel}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                    disabled={loading}
                  />
                  Subir logo
                </label>

                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)' }} />
                ) : (
                  <div style={{ width: 96, height: 64, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    Sin logo
                  </div>
                )}

                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => onLogoChange(null)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <small style={styles.hint}>Formato .png/.jpg. Si no subes, puedes añadir luego desde editing.</small>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  padding: '10px 14px',
                  background: '#111827',
                  color: '#fff',
                  borderRadius: 10,
                  border: 'none',
                  cursor: loading ? 'default' : 'pointer',
                  fontWeight: 700,
                  opacity: loading ? 0.8 : 1,
                  boxShadow: loading ? 'inset 0 0 6px rgba(0,0,0,0.06)' : '0 6px 18px rgba(17,24,39,0.06)',
                }}
              >
                {loading ? 'Creando...' : 'Crear tienda'}
              </button>

              <button
                type="button"
                onClick={() => nav('/catalog')}
                disabled={loading}
                style={{
                  padding: '10px 12px',
                  background: 'transparent',
                  border: '1px solid rgba(17,24,39,0.06)',
                  borderRadius: 10,
                  cursor: 'pointer',
                }}
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

/* ---------- estilos ---------- */
const styles = {
  page: { padding: 20, display: 'flex', justifyContent: 'center', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' },
  container: { width: '100%', maxWidth: 820 },
  card: {
    padding: 18,
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 6px 24px rgba(2,6,23,0.04)',
    border: '1px solid rgba(15,23,42,0.03)',
  },
  field: { marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontWeight: 700 },
  input: { padding: 10, borderRadius: 8, border: '1px solid #e6e9ef', width: '100%' },
  hint: { color: '#6b7280', fontSize: 12 },
  uploadLabel: { padding: '8px 10px', borderRadius: 8, background: '#111827', color: '#fff', cursor: 'pointer', fontWeight: 700 },
  errorBox: { marginTop: 8, color: '#fff', background: '#ef4444', padding: 10, borderRadius: 8 },
  rowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
};
