// src/pages/merchant/CreateProduct.jsx
import { useState, useEffect } from "react";
import api from "../../components/Api";
import { useNavigate, Link } from "react-router-dom";

export default function CreateProduct() {
  const nav = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    stock: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingShop, setLoadingShop] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    api.get("shops/my/")
      .then((res) => setShop(res.data))
      .catch(() => setError("No tienes tienda creada"))
      .finally(() => setLoadingShop(false));
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 3) errs.name = "Nombre debe tener al menos 3 caracteres";
    if (!form.price || Number(form.price) <= 0) errs.price = "Precio debe ser mayor a 0";
    if (!form.stock || Number(form.stock) < 0) errs.stock = "Stock no puede ser negativo";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: undefined });
    setError(null);
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
    setErrors({ ...errors, image: undefined });
    setError(null);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (!shop || !shop.id) {
      setError("No se pudo obtener el ID de la tienda");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('shop', shop.id);
      fd.append('name', form.name);
      fd.append('description', form.description || '');
      fd.append('price', String(Number(form.price)));
      fd.append('stock', String(Number(form.stock || 0)));
      if (imageFile) fd.append('image', imageFile);

      await api.post("products/", fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      nav("/merchant/products");
    } catch (err) {
      console.error("Create product error:", err);
      const msg = err?.response?.data?.detail || err?.message || "Error creando producto";
      setError(msg);

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

  if (loadingShop) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>Cargando...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>{error || "No tienes una tienda creada"}</div>
        <Link to="/merchant/shop/create" style={styles.btnPrimary}>Crear tienda</Link>
      </div>
    );
  }

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
        <Link to="/merchant/products" style={styles.breadcrumb}>← Volver a productos</Link>
        <h2 style={styles.h2}>Crear producto</h2>
        <p style={styles.subtitle}>Agrega un nuevo producto a tu tienda {shop.name}</p>
      </div>

      <div style={styles.card}>
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Nombre del producto *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Camiseta básica"
              style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
              className="input-field"
              disabled={loading}
              required
            />
            {errors.name && <div style={styles.fieldError}>{errors.name}</div>}
          </div>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Precio (COP) *</label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="25000"
                style={{ ...styles.input, ...(errors.price ? styles.inputError : {}) }}
                className="input-field"
                disabled={loading}
                required
                min="0"
                step="100"
              />
              {errors.price && <div style={styles.fieldError}>{errors.price}</div>}
            </div>

            <div>
              <label style={styles.label}>Stock *</label>
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                placeholder="10"
                style={{ ...styles.input, ...(errors.stock ? styles.inputError : {}) }}
                className="input-field"
                disabled={loading}
                required
                min="0"
              />
              {errors.stock && <div style={styles.fieldError}>{errors.stock}</div>}
            </div>
          </div>

          <div>
            <label style={styles.label}>Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe las características del producto..."
              style={styles.textarea}
              className="input-field"
              disabled={loading}
              rows={4}
            />
          </div>

          <div>
            <label style={styles.label}>Imagen</label>
            <input type="file" accept="image/*" onChange={handleImage} disabled={loading} />
            {imagePreview && (
              <div style={{ marginTop: 8 }}>
                <img src={imagePreview} alt="Vista previa" style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </div>
            )}
            {errors.image && <div style={styles.fieldError}>{errors.image}</div>}
          </div>

          <div style={styles.actions}>
            <button type="submit" disabled={loading} style={styles.btnPrimary} className="btn">
              {loading ? 'Creando...' : 'Crear producto'}
            </button>
            <Link to="/merchant/products" style={styles.btnSecondary}>
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
  loadingBox: {
    padding: 40,
    textAlign: 'center',
    color: '#6b7280',
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
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
