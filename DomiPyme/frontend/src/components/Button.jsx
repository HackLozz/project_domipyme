import LoadingSpinner from './LoadingSpinner';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  type = 'button',
  ...props
}) => {
  const variants = {
    primary: {
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      hoverBackground: '#2563eb',
    },
    secondary: {
      background: '#6b7280',
      color: 'white',
      border: 'none',
      hoverBackground: '#4b5563',
    },
    success: {
      background: '#10b981',
      color: 'white',
      border: 'none',
      hoverBackground: '#059669',
    },
    danger: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      hoverBackground: '#dc2626',
    },
    outline: {
      background: 'transparent',
      color: '#3b82f6',
      border: '2px solid #3b82f6',
      hoverBackground: '#eff6ff',
    },
    ghost: {
      background: 'transparent',
      color: '#374151',
      border: 'none',
      hoverBackground: '#f3f4f6',
    },
  };

  const sizes = {
    small: {
      padding: '6px 12px',
      fontSize: '13px',
    },
    medium: {
      padding: '10px 20px',
      fontSize: '14px',
    },
    large: {
      padding: '14px 28px',
      fontSize: '16px',
    },
  };

  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.medium;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles.button,
        ...variantStyle,
        ...sizeStyle,
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled || loading ? 0.6 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
      }}
      className="custom-button"
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="small" color="currentColor" />
      ) : (
        <>
          {icon && <span style={styles.icon}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

const styles = {
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '500',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    outline: 'none',
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px',
  },
};

// CSS para hover
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .custom-button:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .custom-button:not(:disabled):active {
    transform: translateY(0);
  }
`;
if (!document.querySelector('style[data-button]')) {
  styleSheet.setAttribute('data-button', 'true');
  document.head.appendChild(styleSheet);
}

export default Button;
