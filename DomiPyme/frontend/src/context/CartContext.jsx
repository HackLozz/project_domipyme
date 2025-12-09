// CartContext.jsx - Context para gestionar el carrito globalmente
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../components/Api';
import { useAuth } from './AuthProvider';
import { showToast } from '../components/Toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar carrito al iniciar o cuando cambie el usuario
  useEffect(() => {
    if (user) {
      // Usuario autenticado: merge y fetch
      mergeAnonymousCart();
    } else {
      // Usuario anónimo: fetch o usar localStorage
      fetchCart();
    }
  }, [user]);

  // Unificar clave localStorage
  const CART_KEY = 'dp_cart';

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await api.get('cart/');
      setCart(response.data);
      localStorage.setItem(CART_KEY, JSON.stringify(response.data));
    } catch (err) {
      showToast('Error al cargar carrito', 'error');
      // Intentar cargar desde localStorage
      const savedCart = localStorage.getItem(CART_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } finally {
      setLoading(false);
    }
  };

  const mergeAnonymousCart = async () => {
    const sessionKey = getSessionKey();
    if (sessionKey) {
      try {
        await api.post('cart/merge-anonymous/', { session_key: sessionKey });
        localStorage.removeItem('session_key');
      } catch (err) {
        showToast('Error al fusionar carrito', 'error');
      }
    }
    fetchCart();
  };

  const getSessionKey = () => {
    let sessionKey = localStorage.getItem('session_key');
    if (!sessionKey) {
      sessionKey = 'session_' + Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('session_key', sessionKey);
    }
    return sessionKey;
  };

  const addToCart = async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const response = await api.post('cart/add-item/', {
        product_id: productId,
        quantity
      });
      setCart(response.data);
      localStorage.setItem(CART_KEY, JSON.stringify(response.data));
      showToast('Producto agregado al carrito', 'success', 1500);
      return { success: true, cart: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al agregar al carrito';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    setLoading(true);
    try {
      const response = await api.patch(`cart/update-item/${itemId}/`, {
        quantity
      });
      setCart(response.data);
      localStorage.setItem(CART_KEY, JSON.stringify(response.data));
      showToast('Cantidad actualizada', 'success', 1200);
      return { success: true, cart: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error al actualizar cantidad';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    setLoading(true);
    try {
      const response = await api.delete(`cart/remove-item/${itemId}/`);
      setCart(response.data);
      localStorage.setItem(CART_KEY, JSON.stringify(response.data));
      showToast('Producto eliminado del carrito', 'info', 1200);
      return { success: true, cart: response.data };
    } catch (err) {
      showToast('Error al eliminar item', 'error');
      return { success: false, error: 'Error al eliminar item' };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      const response = await api.post('cart/clear/');
      setCart(response.data);
      localStorage.setItem(CART_KEY, JSON.stringify(response.data));
      showToast('Carrito vaciado exitosamente', 'success', 1500);
      return { success: true };
    } catch (err) {
      showToast('Error al vaciar carrito', 'error');
      return { success: false, error: 'Error al vaciar carrito' };
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return cart?.total_items || 0;
  };

  const getSubtotal = () => {
    return cart?.subtotal || '0.00';
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
        getTotalItems,
        getSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook para usar el contexto del carrito
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
