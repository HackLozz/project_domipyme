// src/components/Navbar.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function Navbar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  // cerrar dropdown en click fuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/assets/logo.svg" alt="DomiPyme" style={{ width: 28, height: 28, borderRadius: 6 }} />
        <Link to="/" style={styles.brand}>DomiPyme</Link>
      </div>

      <div style={styles.links}>
        <Link to="/" style={styles.link}>Home</Link>
        <Link to="/catalog" style={styles.link}>Catálogo</Link>
        <Link to="/about" style={styles.link}>Acerca</Link>

        {!user && (
          <>
            <Link to="/login" style={styles.link}>Iniciar sesión</Link>
            <Link to="/register" style={styles.link}>Registrarse</Link>
          </>
        )}

        {user && (
          <>
            <Link to="/cart" style={styles.link}>
              Carrito
              {cartCount > 0 && (<span style={styles.badge}>{cartCount}</span>)}
            </Link>
            <Link to="/checkout" style={styles.link}>Checkout</Link>

            {user.role === 'admin' && <Link to="/admin" style={styles.link}>Panel Admin</Link>}
            {user.role === 'merchant' && <Link to="/merchant" style={styles.link}>Panel Comercio</Link>}
            {user.role === 'customer' && <Link to="/dashboard" style={styles.link}>Dashboard</Link>}

            <div style={{ position: 'relative' }} ref={menuRef}>
              <button style={styles.userBtn} onClick={() => setMenuOpen(v=>!v)} aria-haspopup="menu" aria-expanded={menuOpen}>
                {user.first_name ? user.first_name.charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || 'U')}
              </button>
              {menuOpen && (
                <div style={styles.menu} role="menu">
                  <div style={styles.menuHeader}>
                    <div style={styles.avatarLarge}>{user.first_name ? user.first_name.charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || 'U')}</div>
                    <div>
                      <div style={{ fontWeight: 800 }}>{user.first_name ? `${user.first_name} ${user.last_name||''}`.trim() : user.email}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>{user.email}</div>
                    </div>
                  </div>
                  <Link to="/profile" style={styles.menuItem} onClick={()=>setMenuOpen(false)}>Mi Perfil</Link>
                  <Link to="/orders" style={styles.menuItem} onClick={()=>setMenuOpen(false)}>Mis Órdenes</Link>
                  <div style={styles.menuDivider} />
                  {user.role === 'admin' && <Link to="/admin" style={styles.menuItem} onClick={()=>setMenuOpen(false)}>Panel Admin</Link>}
                  {user.role === 'merchant' && <Link to="/merchant" style={styles.menuItem} onClick={()=>setMenuOpen(false)}>Panel Comercio</Link>}
                  {user.role === 'customer' && <Link to="/dashboard" style={styles.menuItem} onClick={()=>setMenuOpen(false)}>Dashboard</Link>}
                  <button onClick={handleLogout} style={{ ...styles.menuItem, ...styles.menuDanger }}>Cerrar sesión</button>
                </div>
              )}
            </div>
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
  userBtn: {
    background: '#fff',
    color: '#111827',
    border: '1px solid rgba(17,24,39,0.12)',
    width: 34,
    height: 34,
    borderRadius: '50%',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
  },
  menu: {
    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
    background: '#fff', border: '1px solid rgba(17,24,39,0.08)', borderRadius: 12,
    boxShadow: '0 12px 34px rgba(2,6,23,0.14)', width: 240,
    overflow: 'hidden', zIndex: 1000,
  },
  menuHeader: { display: 'flex', gap: 10, alignItems: 'center', padding: 12, borderBottom: '1px solid #eef1f5' },
  avatarLarge: { width: 40, height: 40, borderRadius: '50%', background: '#111827', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 },
  menuItem: { display: 'block', padding: '10px 12px', textDecoration: 'none', color: '#111827', fontWeight: 700, textAlign: 'left', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' },
  menuDivider: { height: 1, background: '#eef1f5' },
  menuDanger: { color: '#991b1b' },
  badge: {
    background: "#3b82f6",
    padding: "2px 7px",
    marginLeft: "6px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "700",
  },
};
