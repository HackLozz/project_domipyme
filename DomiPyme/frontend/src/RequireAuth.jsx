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

  if (loading) return <div>Cargando...</div>;
  if (!user) {
    // guardamos la ruta en state para volver luego del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // Si el usuario no está verificado, redirigir a /verify-email
  if (user && user.is_verified === false) {
    return <Navigate to="/verify-email" replace />;
  }
  return children;
}
