// src/context/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../components/Api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

function safeParseJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    // base64url -> base64
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // objeto usuario o null
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const loadUser = useCallback(async () => {
    const access = localStorage.getItem('access_token');
    if (!access) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Intentamos llamar al endpoint "me" del backend (si existe)
      const res = await api.get('auth/me/');
      setUser(res.data);
    } catch (err) {
      // Si falla (404, 405, 500 o endpoint no existe), intentamos decodificar el JWT como fallback
      const parsed = safeParseJwt(access);
      if (parsed) {
        // Normalmente el payload puede traer email, sub, exp, etc.
        const minimalUser = {
          email: parsed.email || parsed.sub || null,
          sub: parsed.sub || null,
          exp: parsed.exp || null,
          // agrega campos adicionales si los conoces en tu token
        };
        setUser(minimalUser);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password, redirectTo = '/dashboard') => {
    try {
      const res = await api.post('auth/token/', { email, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      // forzar que api use el nuevo token por defecto
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;

      // recargar user (intentará auth/me y si no existe usará JWT)
      await loadUser();

      // navegar solo si estamos en un contexto de router (sí lo estarás)
      nav(redirectTo);
    } catch (err) {
      // Re-lanzar error para que el componente que llama (Login) lo maneje
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    nav('/login');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
