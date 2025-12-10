// src/utils/handleApiError.js
// Centraliza el manejo de errores de peticiones API

/**
 * Extrae un mensaje de error amigable de un error de axios/api
 * @param {any} error - Error lanzado por axios/api
 * @param {string} [defaultMsg] - Mensaje por defecto si no se puede extraer uno
 * @returns {string}
 */
export function extractApiErrorMessage(error, defaultMsg = 'Ocurrió un error inesperado.') {
  if (!error) return defaultMsg;
  // Axios: error.response.data.detail o error.response.data
  if (error.response) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
      if (data.detail) return data.detail;
      // Si hay errores de campo, devolver el primero
      const firstField = Object.keys(data)[0];
      if (firstField && Array.isArray(data[firstField])) {
        return data[firstField][0];
      }
      if (firstField && typeof data[firstField] === 'string') {
        return data[firstField];
      }
    }
  }
  // Mensaje general
  if (error.message) return error.message;
  return defaultMsg;
}

/**
 * Muestra un toast o mensaje visual estándar para errores de API
 * @param {any} error - Error lanzado por axios/api
 * @param {function} showToast - Función para mostrar toast (mensaje, tipo)
 * @param {string} [defaultMsg] - Mensaje por defecto
 */
export function handleApiError(error, showToast, defaultMsg) {
  const msg = extractApiErrorMessage(error, defaultMsg);
  if (typeof showToast === 'function') {
    showToast(msg, 'error');
  }
  // En desarrollo, log completo
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('API Error:', error);
  }
  return msg;
}
