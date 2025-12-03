const SkeletonLoader = ({ type = 'text', width = '100%', height = '20px', count = 1 }) => {
  const skeletons = {
    text: (
      <div style={{ ...styles.skeleton, width, height }} />
    ),
    card: (
      <div style={styles.card}>
        <div style={{ ...styles.skeleton, width: '100%', height: '200px', borderRadius: '8px 8px 0 0' }} />
        <div style={{ padding: '16px' }}>
          <div style={{ ...styles.skeleton, width: '70%', height: '20px', marginBottom: '12px' }} />
          <div style={{ ...styles.skeleton, width: '90%', height: '16px', marginBottom: '8px' }} />
          <div style={{ ...styles.skeleton, width: '60%', height: '16px' }} />
        </div>
      </div>
    ),
    avatar: (
      <div style={{ ...styles.skeleton, width: width || '48px', height: height || '48px', borderRadius: '50%' }} />
    ),
    list: (
      <div style={styles.listItem}>
        <div style={{ ...styles.skeleton, width: '48px', height: '48px', borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...styles.skeleton, width: '60%', height: '16px', marginBottom: '8px' }} />
          <div style={{ ...styles.skeleton, width: '40%', height: '14px' }} />
        </div>
      </div>
    ),
  };

  const renderSkeleton = () => {
    if (type === 'card' || type === 'list') {
      return Array.from({ length: count }).map((_, index) => (
        <div key={index} style={{ marginBottom: type === 'card' ? '16px' : '12px' }}>
          {skeletons[type]}
        </div>
      ));
    }
    
    return Array.from({ length: count }).map((_, index) => (
      <div key={index} style={{ marginBottom: '8px' }}>
        {skeletons[type]}
      </div>
    ));
  };

  return <div>{renderSkeleton()}</div>;
};

const styles = {
  skeleton: {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'loading 1.5s ease-in-out infinite',
    borderRadius: '4px',
  },
  card: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
};

// CSS para animación
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;
if (!document.querySelector('style[data-skeleton]')) {
  styleSheet.setAttribute('data-skeleton', 'true');
  document.head.appendChild(styleSheet);
}

export default SkeletonLoader;
