import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  const footer = (
    <>
      <Button
        variant="ghost"
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        variant={variant}
        onClick={handleConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size="small"
    >
      <div style={styles.message}>
        {message}
      </div>
    </Modal>
  );
};

const styles = {
  message: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#374151',
  },
};

export default ConfirmDialog;
