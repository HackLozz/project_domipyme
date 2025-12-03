import { useState } from 'react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonLoader from '../components/SkeletonLoader';
import { showToast } from '../components/Toast';

const UIShowcase = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSkeletons, setShowSkeletons] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setConfirmOpen(false);
    showToast('Acción confirmada exitosamente', 'success');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎨 Showcase de Componentes UX/UI</h1>

      {/* Buttons Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Botones</h2>
        <div style={styles.buttonGrid}>
          <Button variant="primary" onClick={() => showToast('Botón Primary', 'info')}>
            Primary
          </Button>
          <Button variant="secondary" onClick={() => showToast('Botón Secondary', 'info')}>
            Secondary
          </Button>
          <Button variant="success" onClick={() => showToast('Acción exitosa', 'success')}>
            Success
          </Button>
          <Button variant="danger" onClick={() => showToast('Acción de peligro', 'warning')}>
            Danger
          </Button>
          <Button variant="outline" onClick={() => showToast('Botón Outline', 'info')}>
            Outline
          </Button>
          <Button variant="ghost" onClick={() => showToast('Botón Ghost', 'info')}>
            Ghost
          </Button>
        </div>

        <h3 style={styles.subsectionTitle}>Tamaños</h3>
        <div style={styles.buttonGrid}>
          <Button size="small" onClick={() => showToast('Pequeño', 'info')}>Small</Button>
          <Button size="medium" onClick={() => showToast('Mediano', 'info')}>Medium</Button>
          <Button size="large" onClick={() => showToast('Grande', 'info')}>Large</Button>
        </div>

        <h3 style={styles.subsectionTitle}>Estados</h3>
        <div style={styles.buttonGrid}>
          <Button disabled>Deshabilitado</Button>
          <Button loading>Cargando</Button>
          <Button fullWidth variant="primary">Full Width</Button>
        </div>

        <h3 style={styles.subsectionTitle}>Con Iconos</h3>
        <div style={styles.buttonGrid}>
          <Button icon="➕" variant="success">Agregar</Button>
          <Button icon="✏️" variant="primary">Editar</Button>
          <Button icon="🗑️" variant="danger">Eliminar</Button>
        </div>
      </section>

      {/* Toasts Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Notificaciones Toast</h2>
        <div style={styles.buttonGrid}>
          <Button onClick={() => showToast('Información importante', 'info')}>
            Info Toast
          </Button>
          <Button variant="success" onClick={() => showToast('Operación exitosa', 'success')}>
            Success Toast
          </Button>
          <Button variant="danger" onClick={() => showToast('Error al procesar', 'error')}>
            Error Toast
          </Button>
          <Button variant="secondary" onClick={() => showToast('Advertencia: revisa los datos', 'warning')}>
            Warning Toast
          </Button>
        </div>
      </section>

      {/* Modals Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Modales</h2>
        <div style={styles.buttonGrid}>
          <Button onClick={() => setModalOpen(true)}>
            Abrir Modal
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Confirm Dialog
          </Button>
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Modal de Ejemplo"
          size="medium"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => {
                showToast('Modal confirmado', 'success');
                setModalOpen(false);
              }}>
                Confirmar
              </Button>
            </>
          }
        >
          <p>Este es un ejemplo de un modal con contenido personalizado.</p>
          <p>Puedes incluir cualquier contenido React aquí.</p>
          <p>El modal se puede cerrar presionando ESC o haciendo clic fuera.</p>
        </Modal>

        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
          title="¿Confirmar acción?"
          message="Esta es una acción importante. ¿Estás seguro de que deseas continuar?"
          confirmText="Sí, continuar"
          cancelText="Cancelar"
          variant="danger"
          loading={loading}
        />
      </section>

      {/* Loading Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Loading States</h2>
        <div style={styles.loadingGrid}>
          <div>
            <p>Small</p>
            <LoadingSpinner size="small" />
          </div>
          <div>
            <p>Medium</p>
            <LoadingSpinner size="medium" />
          </div>
          <div>
            <p>Large</p>
            <LoadingSpinner size="large" />
          </div>
        </div>
      </section>

      {/* Skeleton Loaders Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Skeleton Loaders</h2>
        <Button
          variant="outline"
          onClick={() => setShowSkeletons(!showSkeletons)}
          style={{ marginBottom: '20px' }}
        >
          {showSkeletons ? 'Ocultar' : 'Mostrar'} Skeletons
        </Button>

        {showSkeletons && (
          <div style={styles.skeletonGrid}>
            <div>
              <h3>Text Skeleton</h3>
              <SkeletonLoader type="text" count={3} />
            </div>

            <div>
              <h3>Card Skeleton</h3>
              <SkeletonLoader type="card" count={2} />
            </div>

            <div>
              <h3>List Skeleton</h3>
              <SkeletonLoader type="list" count={3} />
            </div>

            <div>
              <h3>Avatar Skeleton</h3>
              <SkeletonLoader type="avatar" />
            </div>
          </div>
        )}
      </section>

      {/* Animations Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Animaciones CSS</h2>
        <div style={styles.animationGrid}>
          <div style={styles.animationCard} className="card-hover">
            <p>Card Hover</p>
          </div>
          <div style={styles.animationCard} className="pulse">
            <p>Pulse</p>
          </div>
          <div style={styles.animationCard} className="scale-in">
            <p>Scale In</p>
          </div>
          <div style={styles.animationCard}>
            <p className="gradient-text">Gradient Text</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '40px',
    color: '#111827',
  },
  section: {
    marginBottom: '60px',
    padding: '30px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#374151',
  },
  subsectionTitle: {
    fontSize: '18px',
    fontWeight: '500',
    marginTop: '30px',
    marginBottom: '15px',
    color: '#6b7280',
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  loadingGrid: {
    display: 'flex',
    gap: '40px',
    justifyContent: 'space-around',
    alignItems: 'center',
    textAlign: 'center',
  },
  skeletonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  animationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  animationCard: {
    padding: '40px',
    background: '#f9fafb',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '600',
    color: '#374151',
  },
};

export default UIShowcase;
