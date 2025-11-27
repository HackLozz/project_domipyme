// src/pages/merchant/CreateProduct.jsx
import { useState } from "react";
import api from "../../components/Api";
import { useNavigate } from "react-router-dom";

export default function CreateProduct() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("products/", form);
    nav("/merchant/products");
  };

  return (
    <div>
      <h1>Crear Producto</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Precio"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <textarea
          placeholder="Descripción"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <button type="submit">Crear</button>
      </form>
    </div>
  );
}
