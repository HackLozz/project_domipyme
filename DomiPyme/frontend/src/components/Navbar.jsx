// src/components/Navbar.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import NotificationBell from "./NotificationBell";
import CartIcon from "./CartIcon";
import "./Navbar.css";

/**
 * Navbar Component
 * Barra de navegación responsive con menú móvil y dropdown de usuario
 * @component
 */
export default function Navbar() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Cerrar dropdown en click fuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        const hamburger = document.querySelector('.navbar__hamburger');
        if (hamburger && !hamburger.contains(e.target)) {
          setMobileMenuOpen(false);
        }
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleLogout = () => {
    if (typeof logout === "function") logout();
    else {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_data");
      nav("/login");
    }
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* Brand */}
        <div className="navbar__brand">
          <img src="/assets/logo.svg" alt="DomiPyme" className="navbar__logo" />
          <Link to="/" className="navbar__title">DomiPyme</Link>
        </div>

        {/* Desktop Links */}
        <div className="navbar__links navbar__links--desktop">
          <Link to="/" className="navbar__link">Home</Link>
          <Link to="/catalog" className="navbar__link">Catálogo</Link>
          <Link to="/about" className="navbar__link">Acerca</Link>

          {!user && (
            <>
              <Link to="/login" className="navbar__link">Iniciar sesión</Link>
              <Link to="/register" className="navbar__link navbar__link--primary">Registrarse</Link>
            </>
          )}

          {user && (
            <>
              <CartIcon />

              {user.role === 'admin' && <Link to="/admin" className="navbar__link">Panel Admin</Link>}
              {user.role === 'merchant' && <Link to="/merchant" className="navbar__link">Panel Comercio</Link>}
              {user.role === 'customer' && <Link to="/dashboard" className="navbar__link">Dashboard</Link>}

              <NotificationBell />

              {/* User Menu */}
              <div className="navbar__user-menu" ref={menuRef}>
                <button 
                  className="navbar__user-btn" 
                  onClick={() => setMenuOpen(v=>!v)} 
                  aria-haspopup="menu" 
                  aria-expanded={menuOpen}
                  aria-label="Menú de usuario"
                >
                  {user.first_name ? user.first_name.charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || 'U')}
                </button>
                {menuOpen && (
                  <div className="navbar__dropdown" role="menu">
                    <div className="navbar__dropdown-header">
                      <div className="navbar__avatar-large">
                        {user.first_name ? user.first_name.charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || 'U')}
                      </div>
                      <div>
                        <div className="navbar__user-name">
                          {user.first_name ? `${user.first_name} ${user.last_name||''}`.trim() : user.email}
                        </div>
                        <div className="navbar__user-email">{user.email}</div>
                      </div>
                    </div>
                    <Link to="/profile" className="navbar__dropdown-item" onClick={()=>setMenuOpen(false)}>Mi Perfil</Link>
                    <Link to="/orders" className="navbar__dropdown-item" onClick={()=>setMenuOpen(false)}>Mis Órdenes</Link>
                    <div className="navbar__divider" />
                    {user.role === 'admin' && <Link to="/admin" className="navbar__dropdown-item" onClick={()=>setMenuOpen(false)}>Panel Admin</Link>}
                    {user.role === 'merchant' && <Link to="/merchant" className="navbar__dropdown-item" onClick={()=>setMenuOpen(false)}>Panel Comercio</Link>}
                    {user.role === 'customer' && <Link to="/dashboard" className="navbar__dropdown-item" onClick={()=>setMenuOpen(false)}>Dashboard</Link>}
                    <button onClick={handleLogout} className="navbar__dropdown-item navbar__dropdown-item--danger">
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button 
          className="navbar__hamburger"
          onClick={() => setMobileMenuOpen(v => !v)}
          aria-label="Abrir menú móvil"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="navbar__mobile-menu" ref={mobileMenuRef}>
          <Link to="/" className="navbar__mobile-link" onClick={closeMobileMenu}>Home</Link>
          <Link to="/catalog" className="navbar__mobile-link" onClick={closeMobileMenu}>Catálogo</Link>
          <Link to="/about" className="navbar__mobile-link" onClick={closeMobileMenu}>Acerca</Link>

          {!user && (
            <>
              <Link to="/login" className="navbar__mobile-link" onClick={closeMobileMenu}>Iniciar sesión</Link>
              <Link to="/register" className="navbar__mobile-link navbar__mobile-link--primary" onClick={closeMobileMenu}>
                Registrarse
              </Link>
            </>
          )}

          {user && (
            <>
              <div className="navbar__mobile-divider" />
              <div className="navbar__mobile-user">
                <div className="navbar__avatar-large">
                  {user.first_name ? user.first_name.charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || 'U')}
                </div>
                <div>
                  <div className="navbar__user-name">
                    {user.first_name ? `${user.first_name} ${user.last_name||''}`.trim() : user.email}
                  </div>
                  <div className="navbar__user-email">{user.email}</div>
                </div>
              </div>
              <Link to="/profile" className="navbar__mobile-link" onClick={closeMobileMenu}>Mi Perfil</Link>
              <Link to="/orders" className="navbar__mobile-link" onClick={closeMobileMenu}>Mis Órdenes</Link>
              <Link to="/cart" className="navbar__mobile-link" onClick={closeMobileMenu}>Carrito</Link>
              <Link to="/notifications" className="navbar__mobile-link" onClick={closeMobileMenu}>Notificaciones</Link>
              {user.role === 'admin' && <Link to="/admin" className="navbar__mobile-link" onClick={closeMobileMenu}>Panel Admin</Link>}
              {user.role === 'merchant' && <Link to="/merchant" className="navbar__mobile-link" onClick={closeMobileMenu}>Panel Comercio</Link>}
              {user.role === 'customer' && <Link to="/dashboard" className="navbar__mobile-link" onClick={closeMobileMenu}>Dashboard</Link>}
              <div className="navbar__mobile-divider" />
              <button onClick={handleLogout} className="navbar__mobile-link navbar__mobile-link--danger">
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
