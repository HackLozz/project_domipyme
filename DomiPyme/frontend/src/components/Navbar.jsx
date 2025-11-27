// src/components/Navbar.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function Navbar() {
  const nav = useNavigate();
  const { user, role, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  // handler memoizado para poder removerlo correctamente
  const handleCartUpdate = useCallback(() => {
    try {
      const updated = JSON.parse(localStorage.getItem("dp_cart") || "[]");
      setCartCount(Array.isArray(updated) ? updated.length : 0);
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    // inicializar
    handleCartUpdate();

    // listener global para actualizar carrito
    window.addEventListener("dp_cart_updated", handleCartUpdate);

    return () => {
      window.removeEventListener("dp_cart_updated", handleCartUpdate);
    };
  }, [handleCartUpdate]);

  const handleLogout = () => {
    // llama al logout del contexto si existe
    if (typeof logout === "function") logout();
    else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_data");
      nav("/login");
    }
  };

  return (
    <nav style={styles.nav}>
      <div>
        <Link to="/" style={styles.brand}>DomiPyme</Link>
      </div>

      <div style={styles.links}>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/catalog" style={styles.link}>Catálogo</Link>

        <Link to="/cart" style={styles.link}>
          Carrito
          {cartCount > 0 && (
            <span style={styles.badge}>{cartCount}</span>
          )}
        </Link>

        {/* Checkout visible solo si hay usuario */}
        {user ? (
          <Link to="/checkout" style={styles.link}>Checkout</Link>
        ) : null}

        {/* Crear tienda / Mis tiendas */}
        {role === "merchant" ? (
          <Link to="/merchant" style={styles.link}>Mi tienda</Link>
        ) : (
          <Link to="/shop/create" style={styles.link}>Crear tienda</Link>
        )}

        {/* Ver tienda: si merchant usamos su shop slug, si no llevamos a catalog */}
        {role === "merchant" && user ? (
          <Link to="/merchant" style={styles.link}>Ver tienda</Link>
        ) : (
          <Link to="/catalog" style={styles.link}>Ver tiendas</Link>
        )}

        {/* sesión */}
        {user ? (
          <>
            {/* Dashboard por rol */}
            {role === "admin" && <Link to="/admin" style={styles.link}>Panel Admin</Link>}
            {role === "merchant" && <Link to="/merchant" style={styles.link}>Panel Comercio</Link>}
            {role === "customer" && <Link to="/dashboard" style={styles.link}>Dashboard</Link>}

            <button onClick={handleLogout} style={styles.btn}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Iniciar sesión</Link>
            <Link to="/register" style={styles.link}>Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "14px 26px",
    background: "#111827",
    color: "white",
    alignItems: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
    position: "sticky",
    top: 0,
    zIndex: 999,
  },
  brand: {
    color: "white",
    textDecoration: "none",
    fontWeight: "800",
    fontSize: "1.3rem",
    letterSpacing: "1px"
  },
  links: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: "6px",
    transition: "0.2s",
  },
  btn: {
    background: "transparent",
    color: "white",
    border: "1px solid rgba(255,255,255,0.3)",
    padding: "6px 10px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  badge: {
    background: "#3b82f6",
    padding: "2px 7px",
    marginLeft: "6px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "700",
  },
};
