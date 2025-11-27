// src/pages/MerchantPanel.jsx
import { useEffect, useState } from "react";
import api from "../components/Api";
import { useAuth } from "../context/AuthProvider";
import { Navigate, Link } from "react-router-dom";

export default function MerchantPanel() {
  const { user, role } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  if (role !== "merchant") return <Navigate to="/" />;

  useEffect(() => {
    api
      .get("shops/my/")
      .then((res) => setShop(res.data))
      .catch(() => setShop(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="page">
      <h1>Panel de Comerciante</h1>

      {!shop && (
        <div>
          <p>No tienes tienda creada aún.</p>
          <Link to="/merchant/shop/create">Crear tienda</Link>
        </div>
      )}

      {shop && (
        <>
          <h2>{shop.name}</h2>
          <p>{shop.description}</p>

          <Link to={`/shops/${shop.slug}`}>Ver tienda pública</Link>
          <br />
          <Link to="/merchant/shop/edit">Editar tienda</Link>

          <hr />

          <h3>Productos</h3>
          <Link to="/merchant/products">Administrar productos</Link>
        </>
      )}
    </div>
  );
}
