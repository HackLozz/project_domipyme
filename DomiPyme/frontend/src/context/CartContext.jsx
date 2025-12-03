// CartContext.jsx - Context para gestionar el carrito globalmente
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../components/Api';
import { useAuth } from './AuthProvider';

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

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/cart/');
      setCart(response.data);
      // Guardar en localStorage para persistencia
      localStorage.setItem('cart', JSON.stringify(response.data));
    } catch (err) {
      console.error('Error al cargar carrito:', err);
      // Intentar cargar desde localStorage
      const savedCart = localStorage.getItem('cart');
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
        await api.post('/api/cart/merge-anonymous/', { session_key: sessionKey });
        localStorage.removeItem('session_key');
      } catch (err) {
        console.error('Error al fusionar carrito:', err);
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
      const response = await api.post('/api/cart/add-item/', {
        product_id: productId,
        quantity
      });
      setCart(response.data);
      localStorage.setItem('cart', JSON.stringify(response.data));
      return { success: true, cart: response.data };
    } catch (err) {
      console.error('Error al agregar al carrito:', err);
      const errorMsg = err.response?.data?.detail || 'Error al agregar al carrito';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    setLoading(true);
    try {
      const response = await api.patch(`/api/cart/update-item/${itemId}/`, {
        quantity
      });
      setCart(response.data);
      localStorage.setItem('cart', JSON.stringify(response.data));
      return { success: true, cart: response.data };
    } catch (err) {
      console.error('Error al actualizar cantidad:', err);
      const errorMsg = err.response?.data?.detail || 'Error al actualizar cantidad';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    setLoading(true);
    try {
      const response = await api.delete(`/api/cart/remove-item/${itemId}/`);
      setCart(response.data);
      localStorage.setItem('cart', JSON.stringify(response.data));
      return { success: true, cart: response.data };
    } catch (err) {
      console.error('Error al eliminar item:', err);
      return { success: false, error: 'Error al eliminar item' };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/cart/clear/');
      setCart(response.data);
      localStorage.setItem('cart', JSON.stringify(response.data));
      return { success: true };
    } catch (err) {
      console.error('Error al vaciar carrito:', err);
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
