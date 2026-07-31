function DeletePropertyModal({
  property,
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm,
}) {
  if (!property) {
    return null;
  }

  return (
    <div className="property-modal-backdrop" role="presentation">
      <section
        aria-labelledby="delete-property-title"
        aria-modal="true"
        className="property-confirmation-modal"
        role="dialog"
      >
        <span className="property-confirmation-icon" aria-hidden="true">
          <i className="bi bi-trash3-fill" />
        </span>
        <h2 id="delete-property-title">Delete property?</h2>
        <p>
          This will permanently remove <strong>{property.title}</strong> from
          your portfolio and public listings. This action cannot be undone.
        </p>

        {errorMessage && (
          <div className="property-confirmation-error" role="alert">
            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
            {errorMessage}
          </div>
        )}

        <div className="property-confirmation-actions">
          <button
            className="btn btn-outline-brand"
            disabled={isDeleting}
            onClick={onCancel}
            type="button"
          >
            Keep Property
          </button>
          <button
            className="btn btn-danger"
            disabled={isDeleting}
            onClick={onConfirm}
            type="button"
          >
            {isDeleting ? (
              <>
                <span
                  aria-hidden="true"
                  className="spinner-border spinner-border-sm"
                />
                Deleting...
              </>
            ) : (
              'Delete Property'
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export default DeletePropertyModal;
