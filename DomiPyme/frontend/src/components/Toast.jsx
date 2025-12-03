import { useState, useEffect } from 'react';

let toastIdCounter = 0;
let toastListeners = [];

export const showToast = (message, type = 'info', duration = 3000) => {
  const toast = {
    id: toastIdCounter++,
    message,
    type,
    duration,
  };
  toastListeners.forEach(listener => listener(toast));
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const addToast = (toast) => {
      setToasts(prev => [...prev, toast]);
      
      if (toast.duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration);
      }
    };

    toastListeners.push(addToast);

    return () => {
      toastListeners = toastListeners.filter(listener => listener !== addToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div style={styles.container}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            ...styles.toast,
            ...styles[toast.type],
          }}
          onClick={() => removeToast(toast.id)}
        >
          <div style={styles.icon}>
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'warning' && '⚠'}
            {toast.type === 'info' && 'ℹ'}
          </div>
          <div style={styles.message}>{toast.message}</div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: '80px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    pointerEvents: 'none',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '300px',
    maxWidth: '500px',
    pointerEvents: 'auto',
    cursor: 'pointer',
    animation: 'slideIn 0.3s ease',
    fontSize: '14px',
    fontWeight: '500',
  },
  success: {
    background: '#10b981',
    color: 'white',
  },
  error: {
    background: '#ef4444',
    color: 'white',
  },
  warning: {
    background: '#f59e0b',
    color: 'white',
  },
  info: {
    background: '#3b82f6',
    color: 'white',
  },
  icon: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
  },
};

// CSS para animación
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(styleSheet);
