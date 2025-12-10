// frontend/src/pages/MerchantPanel.jsx
import React, { useEffect, useState } from "react";
import api from "../components/Api";
import { useAuth } from "../context/AuthProvider";
import { Navigate } from "react-router-dom";
import "./MerchantPanel.css";

export default function MerchantPanel() {
  const { user, loading } = useAuth();
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("");

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
    <div className="merchant-panel-container">
      <h1 className="merchant-panel-title">Panel de Comerciante</h1>

      {/* Selección de tienda */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <label htmlFor="shop-select" style={{ fontWeight: 600 }}>Selecciona tu tienda:</label>
        <select
          id="shop-select"
          className="merchant-panel-select"
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
        {selectedShop && (
          <button
            className="merchant-action-btn"
            style={{ marginLeft: 8 }}
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin + "/shop/" + selectedShop);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            aria-label="Copiar enlace de tienda"
          >
            {copied ? "¡Enlace copiado!" : "Copiar enlace público"}
          </button>
        )}
      </div>

      {/* Filtro de productos */}
      {selectedShop && (
        <div style={{ marginTop: 24, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid #cbd5e1", minWidth: 220 }}
            aria-label="Buscar producto"
          />
          <span style={{ color: "#64748b", fontSize: 13 }}>
            {products.length} producto(s)
          </span>
        </div>
      )}

      {/* Productos */}
      {selectedShop && (
        <div style={{ marginTop: 8 }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#334155", marginBottom: 8 }}>Productos</h2>

          {loadingData ? (
            <div className="merchant-loader">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="merchant-empty">No hay productos registrados.</div>
          ) : (
            <table className="merchant-products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.filter(p =>
                  !filter || (p.name && p.name.toLowerCase().includes(filter.toLowerCase()))
                ).map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>${Number(p.price).toLocaleString("es-CO")}</td>
                    <td>
                      <span className={p.is_active ? "merchant-status-active" : "merchant-status-inactive"}>
                        {p.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="merchant-action-btn"
                        onClick={() => updateProductStatus(p.id, !p.is_active)}
                        aria-label={p.is_active ? "Desactivar producto" : "Activar producto"}
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
