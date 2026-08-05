import LoadingSpinner from './LoadingSpinner.jsx';
import PropertyImage from './PropertyImage.jsx';
import {
  formatPropertyDate,
  propertyPriceFormatter,
} from '../utils/propertyFormatting.js';

const STATUS_LABELS = Object.freeze({
  pending: 'Pending',
  approved: 'Accepted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
});

function TenantRentalRequestCard({
  isActionDisabled,
  isCancelling,
  onCancel,
  rentalRequest,
}) {
  const isPending = rentalRequest.status === 'pending';
  const statusLabel = STATUS_LABELS[rentalRequest.status] || rentalRequest.status;
  const property = {
    city: rentalRequest.propertyCity,
    imageUrl: rentalRequest.propertyImageUrl,
    propertyType: rentalRequest.propertyType,
    title: rentalRequest.propertyTitle,
  };
  const headingId = `tenant-request-${rentalRequest.id}-property`;

  return (
    <article className="tenant-request-card" aria-labelledby={headingId}>
      <div className="tenant-request-image-wrap">
        <PropertyImage className="tenant-request-image" property={property} />
        <span
          className={`tenant-request-status is-${rentalRequest.status}`}
          aria-label={`Status: ${statusLabel}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="tenant-request-body">
        <p className="tenant-request-city">
          <i className="bi bi-geo-alt-fill" aria-hidden="true" />
          {rentalRequest.propertyCity}
        </p>
        <h2 id={headingId}>{rentalRequest.propertyTitle}</h2>
        <p className="tenant-request-price">
          {propertyPriceFormatter.format(rentalRequest.propertyPrice)}
          <span>/ month</span>
        </p>

        <dl className="tenant-request-details">
          <div>
            <dt>Property owner</dt>
            <dd>{rentalRequest.ownerName}</dd>
          </div>
          <div>
            <dt>Requested on</dt>
            <dd>{formatPropertyDate(rentalRequest.createdAt)}</dd>
          </div>
        </dl>

        <div className="tenant-request-message">
          <span>
            <i className="bi bi-chat-left-text" aria-hidden="true" />
            Your message
          </span>
          <p>{rentalRequest.message || 'No message was included.'}</p>
        </div>

        {isPending && (
          <button
            className="btn btn-outline-danger tenant-request-cancel"
            disabled={isActionDisabled}
            onClick={() => onCancel(rentalRequest)}
            type="button"
          >
            {isCancelling ? (
              <LoadingSpinner label="Cancelling..." />
            ) : (
              <>
                <i className="bi bi-x-circle" aria-hidden="true" />
                Cancel Request
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}

export default TenantRentalRequestCard;
