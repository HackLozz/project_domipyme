// Cart.jsx - Página del carrito de compras integrada con backend
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../components/Toast';
import '../styles.css';
import './Cart.css';

const Cart = () => {
  const { cart, loading, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState({});

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 0) return;
    
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    const result = await updateQuantity(itemId, newQuantity);
    if (!result.success) {
      showToast(result.error, 'error');
    } else if (newQuantity === 0) {
      showToast('Producto removido del carrito', 'info', 2000);
    } else {
      showToast('Cantidad actualizada', 'success', 2000);
    }
    setUpdating(prev => ({ ...prev, [itemId]: false }));
  };

  const handleRemove = async (itemId) => {
    if (!confirm('¿Eliminar este producto del carrito?')) return;
    
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    const result = await removeItem(itemId);
    if (!result.success) {
      showToast(result.error, 'error');
    } else {
      showToast('Producto eliminado del carrito', 'success', 2000);
    }
    setUpdating(prev => ({ ...prev, [itemId]: false }));
  };

  const handleClearCart = async () => {
    // Mejor usar un modal/dialog personalizado, pero window.confirm funciona como fallback
    const userConfirmed = window.confirm('¿Estás seguro de que deseas vaciar todo el carrito? Esta acción no se puede deshacer.');
    if (!userConfirmed) return;
    
    const result = await clearCart();
    if (!result.success) {
      showToast(result.error, 'error');
    } else {
      showToast('Carrito vaciado exitosamente', 'success', 2000);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading && !cart) {
    return (
      <div className="container">
        <div className="loading-spinner">Cargando carrito...</div>
      </div>
    );
  };

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || '0.00';
  const isEmpty = items.length === 0;

  return (
    <div className="container">
      <div className="cart-page">
        <div className="cart-header">
          <h1>🛒 Mi Carrito</h1>
          {!isEmpty && (
            <button
              onClick={handleClearCart}
              className="btn btn-secondary btn-small"
              disabled={loading}
            >
              Vaciar Carrito
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Tu carrito está vacío</h2>
            <p>Agrega productos para comenzar tu compra</p>
            <button onClick={() => navigate('/catalog')} className="btn btn-primary">
              Explorar Productos
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} />
                    ) : (
                      <div className="no-image">📦</div>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <h3>{item.product_name}</h3>
                    <p className="cart-item-price">
                      ${parseFloat(item.price_snapshot).toFixed(2)}
                    </p>
                    {item.current_price !== item.price_snapshot && (
                      <p className="price-change-notice">
                        Precio actual: ${parseFloat(item.current_price).toFixed(2)}
                      </p>
                    )}
                    <p className="stock-info">
                      Stock disponible: {item.product_stock} unidades
                    </p>
                  </div>

                  <div className="cart-item-quantity">
                    <label>Cantidad:</label>
                    <div className="quantity-controls">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={updating[item.id] || item.quantity <= 1}
                        className="quantity-btn"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                        min="0"
                        max={item.product_stock}
                        disabled={updating[item.id]}
                        className="quantity-input"
                      />
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={updating[item.id] || item.quantity >= item.product_stock}
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-total">
                    <p className="item-total-label">Total:</p>
                    <p className="item-total-price">
                      ${parseFloat(item.total_price).toFixed(2)}
                    </p>
                  </div>

                  <div className="cart-item-actions">
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={updating[item.id]}
                      className="btn-remove"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h2>Resumen del Pedido</h2>
              <div className="summary-row">
                <span>Subtotal ({cart.total_items} items):</span>
                <span className="summary-amount">${parseFloat(subtotal).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Envío:</span>
                <span className="summary-amount">A calcular</span>
              </div>
              <div className="summary-row total-row">
                <span>Total:</span>
                <span className="summary-total">${parseFloat(subtotal).toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="btn btn-primary btn-checkout"
                disabled={loading}
              >
                Proceder al Pago
              </button>

              <button
                onClick={() => navigate('/catalog')}
                className="btn btn-secondary"
              >
                Continuar Comprando
              </button>

              <div className="secure-checkout">
                <p>🔒 Compra Segura</p>
                <p className="secure-text">Tus datos están protegidos</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
