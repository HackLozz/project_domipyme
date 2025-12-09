// src/pages/merchant/CreateShop.jsx
import { useState, useEffect, useRef } from "react";
import api from "../../components/Api";
import { useNavigate, Link } from "react-router-dom";
import { showToast } from "../../components/Toast";

export default function CreateShop() {
  const nav = useNavigate();
  const fileInputRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    phone: "",
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const onLogoChange = (file) => {
    setError(null);
    if (!file) {
      setLogoPreview(null);
      setLogoBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const max = 3 * 1024 * 1024;
    if (file.size > max) {
      showToast('El logo supera el tamaño máximo de 3 MB', 'error');
      setError('El logo supera el tamaño máximo de 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      setLogoBase64(ev.target.result);
    };
    reader.onerror = () => {
      showToast('No se pudo leer la imagen', 'error');
      setError('No se pudo leer la imagen.');
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 3) errs.name = "Nombre debe tener al menos 3 caracteres";
    if (!form.description || form.description.trim().length < 10) errs.description = "Descripción muy corta (mín. 10 caracteres)";
    if (!form.city || form.city.trim().length < 2) errs.city = "Ciudad requerida";
    if (form.description && form.description.length > 500) errs.description = "Descripción muy larga (máx. 500 caracteres)";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: undefined });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast('Por favor corrige los errores en el formulario', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
      };
      
      if (logoBase64) {
        payload.image = logoBase64;
      }

      await api.post("shops/", payload);
      showToast('¡Tienda creada exitosamente!', 'success', 3000);
      
      // Redirigir al panel del merchant después de 1.5 segundos
      setTimeout(() => {
        nav("/merchant");
      }, 1500);
    } catch (err) {
      console.error("Create shop error:", err);
      const msg = err?.response?.data?.detail || err?.message || "Error creando tienda";
      setError(msg);
      showToast(msg, 'error');

      const respData = err?.response?.data;
      if (respData && typeof respData === 'object') {
        const fieldErrs = {};
        for (const key of Object.keys(respData)) {
          if (key !== 'detail') {
            const val = respData[key];
            fieldErrs[key] = Array.isArray(val) ? val.join(' ') : String(val);
          }
        }
        setErrors(fieldErrs);
      }
    } finally {
      setLoading(false);
    }
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

      <div style={styles.header}>
        <Link to="/merchant" style={styles.breadcrumb}>← Volver al panel</Link>
        <h2 style={styles.h2}>Crear tienda</h2>
        <p style={styles.subtitle}>Completa la información para crear tu tienda en DomiPyme</p>
      </div>

      <div style={styles.card}>
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Nombre de la tienda *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Tienda de María"
              style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
              className="input-field"
              disabled={loading}
              required
            />
            {errors.name && <div style={styles.fieldError}>{errors.name}</div>}
          </div>

          <div>
            <label style={styles.label}>Descripción *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe tu tienda y los productos que ofreces..."
              style={{ ...styles.textarea, ...(errors.description ? styles.inputError : {}) }}
              className="input-field"
              disabled={loading}
              required
              rows={4}
            />
            <small style={styles.hint}>{form.description.length}/500 caracteres</small>
            {errors.description && <div style={styles.fieldError}>{errors.description}</div>}
          </div>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Ciudad *</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Ej: Bogotá"
                style={{ ...styles.input, ...(errors.city ? styles.inputError : {}) }}
                className="input-field"
                disabled={loading}
                required
              />
              {errors.city && <div style={styles.fieldError}>{errors.city}</div>}
            </div>

            <div>
              <label style={styles.label}>Teléfono</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Ej: 3001234567"
                style={styles.input}
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Dirección</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Ej: Calle 123 #45-67"
              style={styles.input}
              className="input-field"
              disabled={loading}
            />
          </div>

          <div>
            <label style={styles.label}>Logo de la tienda (opcional)</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={styles.uploadLabel}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                  disabled={loading}
                />
                Subir logo
              </label>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="preview"
                  style={{
                    width: 80,
                    height: 80,
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

          <div style={styles.actions}>
            <button type="submit" disabled={loading} style={styles.btnPrimary} className="btn">
              {loading ? 'Creando...' : 'Crear tienda'}
            </button>
            <Link to="/merchant" style={styles.btnSecondary}>
              Cancelar
            </Link>
          </div>
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
  header: {
    marginBottom: 24,
  },
  breadcrumb: {
    fontSize: 13,
    color: '#6b7280',
    textDecoration: 'none',
    fontWeight: 600,
    display: 'block',
    marginBottom: 12,
  },
  h2: {
    margin: 0,
    fontSize: 28,
    fontWeight: 900,
    color: '#111827',
  },
  subtitle: {
    margin: '4px 0 0',
    color: '#6b7280',
    fontSize: 14,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 6px 24px rgba(2,6,23,0.06)',
    border: '1px solid rgba(15,23,42,0.03)',
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
  hint: {
    display: 'block',
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  input: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    fontSize: 14,
  },
  textarea: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  fieldError: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: 600,
  },
  uploadLabel: {
    padding: '8px 12px',
    background: '#111827',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  noLogo: {
    width: 80,
    height: 80,
    background: '#f3f4f6',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontSize: 12,
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
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
