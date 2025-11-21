import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const nav = useNavigate();
  const token = localStorage.getItem("access_token");

  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("dp_cart") || "[]");
    setCartCount(cart.length);

    // listener para actualizar carrito desde otros componentes
    window.addEventListener("dp_cart_updated", () => {
      const updated = JSON.parse(localStorage.getItem("dp_cart") || "[]");
      setCartCount(updated.length);
    });

    return () => window.removeEventListener("dp_cart_updated", () => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    nav("/login");
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

        <Link to="/checkout" style={styles.link}>Checkout</Link>
        <Link to="/shop/create" style={styles.link}>Crear tienda</Link>
        <Link to="/shop" style={styles.link}>Ver tienda</Link>

        {token ? (
          <>
            <Link to="/dashboard" style={styles.link}>Dashboard</Link>

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
