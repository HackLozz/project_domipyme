// frontend/src/pages/MerchantPanel.jsx
import React, { useEffect, useState } from "react";
import api from "../components/Api";
import { useAuth } from "../context/AuthProvider";
import { Navigate } from "react-router-dom";

export default function MerchantPanel() {
  const { user, loading } = useAuth();
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // -----------------------------
  // 1. VALIDACIÓN DE USUARIO
  // -----------------------------
  if (!loading && (!user || user.role !== "merchant")) {
    return <Navigate to="/login" replace />;
  }

  // -----------------------------
  // 2. CARGAR TIENDAS DEL MERCHANT
  // -----------------------------
  useEffect(() => {
    if (!user) return;

    const fetchShops = async () => {
      try {
        const res = await api.get("/shops/");
        setShops(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error loading shops:", error);
      }
    };

    fetchShops();
  }, [user]);

  // -----------------------------
  // 3. CARGAR PRODUCTOS DE LA TIENDA SELECCIONADA
  // -----------------------------
  useEffect(() => {
    if (!selectedShop) return;

    const fetchProducts = async () => {
      setLoadingData(true);
      try {
        const res = await api.get(`/shops/${selectedShop}/products/`);
        setProducts(res.data);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchProducts();
  }, [selectedShop]);

  // -----------------------------
  // 4. ACTUALIZACIÓN DE PRODUCTO
  // -----------------------------
  const updateProductStatus = async (productId, newStatus) => {
    try {
      await api.patch(`/shops/products/${productId}/`, {
        is_active: newStatus,
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, is_active: newStatus } : p
        )
      );
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Merchant Panel</h1>

      {/* Selección de tienda */}
      <div className="mt-4">
        <label className="font-semibold">Selecciona tu tienda:</label>
        <select
          className="border p-2 ml-2"
          value={selectedShop || ""}
          onChange={(e) => setSelectedShop(e.target.value)}
        >
          <option value="">-- Selecciona --</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </div>

      {/* Productos */}
      {selectedShop && (
        <div className="mt-6">
          <h2 className="text-lg font-bold">Productos</h2>

          {loadingData ? (
            <p>Cargando productos...</p>
          ) : products.length === 0 ? (
            <p>No hay productos registrados.</p>
          ) : (
            <table className="w-full mt-4 border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Nombre</th>
                  <th className="p-2 border">Precio</th>
                  <th className="p-2 border">Estado</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-2 border">{p.id}</td>
                    <td className="p-2 border">{p.name}</td>
                    <td className="p-2 border">${p.price}</td>
                    <td className="p-2 border">
                      {p.is_active ? "Activo" : "Inactivo"}
                    </td>
                    <td className="p-2 border">
                      <button
                        className="px-2 py-1 bg-blue-500 text-white rounded"
                        onClick={() => updateProductStatus(p.id, !p.is_active)}
                      >
                        {p.is_active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
