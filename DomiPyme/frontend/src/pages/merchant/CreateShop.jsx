// src/pages/merchant/CreateShop.jsx
import { useState } from "react";
import api from "../../components/Api";
import { useNavigate } from "react-router-dom";

export default function CreateShop() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", description: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("shops/", form);
      nav("/merchant");
    } catch (err) {
      alert("Error creando tienda");
    }
  };

  return (
    <div>
      <h1>Crear Tienda</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <textarea
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <button type="submit">Crear</button>
      </form>
    </div>
  );
}
