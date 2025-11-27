// src/pages/merchant/EditShop.jsx
import { useEffect, useState } from "react";
import api from "../../components/Api";
import { useNavigate } from "react-router-dom";

export default function EditShop() {
  const nav = useNavigate();
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.get("shops/my/").then((res) => {
      setForm({ name: res.data.name, description: res.data.description });
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.put("shops/my/", form);
    nav("/merchant");
  };

  if (!form) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Editar Tienda</h1>

      <form onSubmit={handleSubmit}>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <button type="submit">Guardar cambios</button>
      </form>
    </div>
  );
}
