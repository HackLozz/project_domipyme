/**
 * Componente RequireAuth
 * Protege rutas privadas y gestiona redirecciones según estado de autenticación y verificación.
 * - Si el usuario no está autenticado, redirige a /login y guarda la ruta original.
 * - Si el usuario no está verificado, redirige a /verify-email.
 * - Si está autenticado y verificado, renderiza el contenido protegido.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthProvider';

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Verifica expiración de token JWT
  function isTokenExpired() {
    try {
      const access = localStorage.getItem('access_token');
      if (!access) return true;
      const payload = JSON.parse(atob(access.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return false;
    }
  }

  if (loading) return <div>Cargando...</div>;
  if (!user) {
    // Si el token expiró, mostrar mensaje amigable
    if (isTokenExpired()) {
      return <div style={{padding:24, textAlign:'center', color:'#b91c1c', background:'#fef2f2', borderRadius:10, margin:40}}>
        <h2>Sesión expirada</h2>
        <p>Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar.</p>
        <a href="/login" style={{color:'#2563eb', fontWeight:700}}>Ir al login</a>
      </div>;
    }
    // guardamos la ruta en state para volver luego del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // Si el usuario no está verificado, redirigir a /verify-email
  if (user && user.is_verified === false) {
    return <Navigate to="/verify-email" replace />;
  }
  return children;
}
