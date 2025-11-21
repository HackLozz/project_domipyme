// src/components/Api.js  (VITE)
import axios from 'axios';

const DEFAULT_BASE = 'http://127.0.0.1:8000/api/'; // URL absoluta por defecto en dev
const BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE;

const api = axios.create({
  baseURL: BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  // withCredentials: true, // descomenta si usas cookies/sessions
});

// Helpers tokens
const getAccess = () => localStorage.getItem('access_token');
const getRefresh = () => localStorage.getItem('refresh_token');

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

// Request interceptor -> inyecta Authorization si hay token
api.interceptors.request.use(
  (config) => {
    const token = getAccess();
    if (token && config && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor -> refresh token on 401 (Simple JWT style)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err?.config;

    if (!err.response || err.response.status !== 401 || !originalRequest) {
      return Promise.reject(err);
    }

    if (originalRequest._retry) {
      return Promise.reject(err);
    }

    const refreshToken = getRefresh();
    if (!refreshToken) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        })
        .catch((e) => Promise.reject(e));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Normalizar URL del refresh: si BASE es relativo o absoluto, usar URL constructor seguro
      const refreshPath = 'auth/token/refresh/';
      const refreshUrl = new URL(refreshPath, BASE).toString();

      // axios directo para evitar interceptors recursivos
      const resp = await axios.post(refreshUrl, { refresh: refreshToken }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });

      const newAccess = resp.data?.access;
      if (!newAccess) throw new Error('No access token in refresh response');

      localStorage.setItem('access_token', newAccess);
      api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccess;
      processQueue(null, newAccess);
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
