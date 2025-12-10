// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { AuthProvider } from './context/AuthProvider';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/colors.css';
import './animations.css';
import { disableConsoleInProd } from './utils/disableConsoleInProd';

// Deshabilita logs de consola en producción
disableConsoleInProd();

/**
 * Punto de entrada principal del frontend.
 * Renderiza la aplicación con providers globales y manejo de errores.
 * Configura React Router y muestra advertencia si falta el root.
 */
const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
};

const container = document.getElementById('root');

if (!container) {
  // Mensaje claro para debugging si faltara el root en index.html
  // eslint-disable-next-line no-console
  console.error('Root element not found. Asegúrate que index.html contiene: <div id="root"></div>');
} else {
  createRoot(container).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter future={routerConfig.future}>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
