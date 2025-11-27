// src/pages/merchant/EditProduct.jsx
import { useState, useEffect } from "react";
import api from "../../components/Api";
import { useParams, useNavigate } from "react-router-dom";

export default function EditProduct() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.get(`products/${id}/`).then((res) =>
      setForm({
        name: res.data.name,
        price: res.data.price,
        description: res.data.description,
      })
    );
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.put(`products/${id}/`, form);
    nav("/merchant/products");
  };

  if (!form) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Editar Producto</h1>

      <form onSubmit={handleSubmit}>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <textarea
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
}
