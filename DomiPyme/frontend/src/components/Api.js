// Api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/', // ajusta según tu backend (ej: 'http://127.0.0.1:8000/')
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // tiempo de espera de 10 segundos
});

// Aux: obtener tokens
const getAccess = () => localStorage.getItem('access_token');
const getRefresh = () => localStorage.getItem('refresh_token');

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// interceptor response: si 401 e refresh disponible -> intentar refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Evitar loop
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefresh();
      if (!refreshToken) {
        return Promise.reject(err);
      }

      if (isRefreshing) {
        // Encolar la petición hasta que termine el refresh
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
        const resp = await axios.post('/api/auth/token/refresh/', { refresh: refreshToken });
        const newAccess = resp.data.access;

        localStorage.setItem('access_token', newAccess);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccess;
        processQueue(null, newAccess);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Si refresh falla -> limpiar tokens y forzar logout en la app
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // opcional: window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;