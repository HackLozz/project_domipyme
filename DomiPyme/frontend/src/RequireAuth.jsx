// RequireAuth.jsx
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
  return children;
}
