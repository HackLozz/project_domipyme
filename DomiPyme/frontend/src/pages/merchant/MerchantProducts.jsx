// src/pages/merchant/MerchantProducts.jsx
import { useEffect, useState } from "react";
import api from "../../components/Api";
import { Link } from "react-router-dom";

export default function MerchantProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("products/my/").then((res) => setProducts(res.data));
  }, []);

  return (
    <div>
      <h1>Mis Productos</h1>

      <Link to="/merchant/products/create">Crear Producto</Link>

      {products.length === 0 && <p>No tienes productos</p>}

      {products.map((p) => (
        <div key={p.id}>
          <h3>{p.name}</h3>
          <p>{p.price} COP</p>
          <Link to={`/merchant/products/${p.id}/edit`}>Editar</Link>
        </div>
      ))}
    </div>
  );
}
