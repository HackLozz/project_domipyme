// src/utils/disableConsoleInProd.js
// Deshabilita logs de consola en producción para evitar fugas de información

export function disableConsoleInProd() {
  if (import.meta.env.PROD) {
    // Puedes dejar console.error si quieres ver errores críticos en producción
    // Para ocultar todo, descomenta las siguientes líneas:
    // console.log = () => {};
    // console.info = () => {};
    // console.warn = () => {};
    // console.error = () => {};

    // Por defecto, solo ocultamos log/info/warn
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    // Si quieres ocultar errores también, descomenta:
    // console.error = () => {};
  }
}
