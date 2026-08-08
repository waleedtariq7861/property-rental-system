import { useEffect, useRef } from 'react';

function AdminConfirmationModal({
  cancelLabel = 'Cancel',
  confirmLabel,
  errorMessage,
  isProcessing,
  message,
  onCancel,
  onConfirm,
  title,
}) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();

    function handleEscape(event) {
      if (event.key === 'Escape' && !isProcessing) {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isProcessing, onCancel]);

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <section
        aria-labelledby="admin-confirmation-title"
        aria-modal="true"
        className="admin-confirmation-modal"
        role="dialog"
      >
        <span className="admin-confirmation-icon" aria-hidden="true">
          <i className="bi bi-exclamation-triangle-fill" />
        </span>
        <h2 id="admin-confirmation-title">{title}</h2>
        <div className="admin-confirmation-message">{message}</div>

        {errorMessage && (
          <div className="admin-modal-error" role="alert">
            <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="admin-modal-actions">
          <button
            className="btn btn-outline-brand"
            disabled={isProcessing}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="btn btn-danger"
            disabled={isProcessing}
            onClick={onConfirm}
            type="button"
          >
            {isProcessing ? (
              <>
                <span
                  aria-hidden="true"
                  className="spinner-border spinner-border-sm"
                />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default AdminConfirmationModal;
