const LoadingSpinner = ({ size = 'medium', color = '#3b82f6', fullScreen = false }) => {
  const sizes = {
    small: 20,
    medium: 40,
    large: 60,
  };

  const spinnerSize = sizes[size] || sizes.medium;

  const spinner = (
    <div style={styles.spinnerContainer}>
      <div
        style={{
          ...styles.spinner,
          width: spinnerSize,
          height: spinnerSize,
          borderColor: `${color}20`,
          borderTopColor: color,
        }}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div style={styles.fullScreen}>
        {spinner}
      </div>
    );
  }

  return spinner;
};

const styles = {
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  spinner: {
    border: '3px solid',
    borderRadius: '50%',
    borderTopColor: 'transparent',
    animation: 'spin 0.8s linear infinite',
  },
  fullScreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.9)',
    zIndex: 9998,
  },
};

// CSS para animación
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
if (!document.querySelector('style[data-spinner]')) {
  styleSheet.setAttribute('data-spinner', 'true');
  document.head.appendChild(styleSheet);
}

export default LoadingSpinner;
