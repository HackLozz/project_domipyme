// src/context/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../components/Api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

function safeParseJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
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

  const persistUser = (u) => {
    try {
      localStorage.setItem('user_data', JSON.stringify(u || null));
    } catch {}
  };

  const clearAuth = () => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
    } catch {}
    setUser(null);
  };

  const loadUser = useCallback(async () => {
    setLoading(true);
    const access = localStorage.getItem('access_token');
    if (!access) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(API_ROUTES.AUTH.ME);
      const u = res.data;
      // Priorizar el campo 'role' si está presente
      const normalized = {
        id: u.id,
        email: u.email,
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        role: u.role || (u.is_staff ? 'admin' : (u.is_merchant ? 'merchant' : 'customer')),
        is_staff: !!u.is_staff,
        is_merchant: !!u.is_merchant,
      };
      setUser(normalized);
      persistUser(normalized);
      setLoading(false);
      return;
    } catch (err) {
      // Si auth/me devuelve 401 -> token inválido/expirado -> limpiamos estado y salimos silenciosamente
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        clearAuth();
        setLoading(false);
        return;
      }

      // fallback: intentamos parsear el token (si no es 401)
      const parsed = safeParseJwt(access);
      if (parsed) {
        const normalized = {
          id: parsed.uid || parsed.sub || null,
          email: parsed.email || parsed.sub || null,
          first_name: parsed.name ? String(parsed.name).split(' ')[0] : '',
          last_name: parsed.name ? String(parsed.name).split(' ').slice(1).join(' ') : '',
          role: parsed.role || (parsed.is_staff ? 'admin' : (parsed.is_merchant ? 'merchant' : 'customer')),
          is_staff: !!parsed.is_staff,
          is_merchant: !!parsed.is_merchant,
        };
        setUser(normalized);
        persistUser(normalized);
        setLoading(false);
        return;
      }

      clearAuth();
      setLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    try {
      const s = localStorage.getItem('user_data');
      if (s) {
        const parsed = JSON.parse(s);
        setUser(parsed);
      }
    } catch {}

    loadUser()
    const access = localStorage.getItem('access_token');
    if (access) {
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    }
  }, [loadUser]);

  const login = async (email, password) => {
    try {
      let res;
          res = await api.post('auth/token/', { email, password });

      const access = res.data.access ?? res.data.access_token ?? res.data.accessToken ?? null;
      const refresh = res.data.refresh ?? res.data.refresh_token ?? res.data.refreshToken ?? null;

      if (!access || !refresh) {
        throw new Error('No se obtuvieron tokens del servidor');
      }

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      let finalUser = null;
      if (res.data.user) {
        const u = res.data.user;
        finalUser = {
          id: u.id,
          email: u.email,
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          role: u.is_staff ? 'admin' : (u.is_merchant ? 'merchant' : 'customer'),
          is_staff: !!u.is_staff,
          is_merchant: !!u.is_merchant,
        };
      } else {
        const parsed = safeParseJwt(access);
        finalUser = {
          id: parsed?.uid ?? parsed?.sub ?? null,
          email: parsed?.email ?? null,
          first_name: parsed?.name ? String(parsed.name).split(' ')[0] : '',
          last_name: parsed?.name ? String(parsed.name).split(' ').slice(1).join(' ') : '',
          role: parsed?.role ?? (parsed?.is_staff ? 'admin' : (parsed?.is_merchant ? 'merchant' : 'customer')),
          is_staff: !!parsed?.is_staff,
          is_merchant: !!parsed?.is_merchant,
        };
      }

      setUser(finalUser);
      persistUser(finalUser);

      if (finalUser.role === 'admin') nav('/admin');
      else if (finalUser.role === 'merchant') nav('/merchant');
      else nav('/dashboard');

      return finalUser;
    } catch (err) {
      clearAuth();
      throw err;
    }
  };

  const logout = () => {
    clearAuth();
    nav('/login');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
