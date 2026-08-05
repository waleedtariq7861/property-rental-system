import LoadingSpinner from './LoadingSpinner.jsx';
import {
  formatPropertyDate,
  formatPropertyType,
  propertyPriceFormatter,
} from '../utils/propertyFormatting.js';

const STATUS_LABELS = Object.freeze({
  pending: 'Pending',
  approved: 'Accepted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
});

function OwnerRentalRequestCard({
  rentalRequest,
  isDecisionDisabled,
  isUpdating,
  pendingStatus,
  onDecision,
}) {
  const isPending = rentalRequest.status === 'pending';
  const headingId = `rental-request-${rentalRequest.id}-tenant`;

  return (
    <article
      className="owner-request-card"
      aria-labelledby={headingId}
    >
      <header className="owner-request-card-header">
        <span className="owner-request-tenant-avatar" aria-hidden="true">
          {rentalRequest.tenantName.charAt(0).toUpperCase()}
        </span>
        <div>
          <span className="owner-request-label">Rental request from</span>
          <h2 id={headingId}>{rentalRequest.tenantName}</h2>
          <div className="owner-request-tenant-contact">
            <a href={`mailto:${rentalRequest.tenantEmail}`}>
              <i className="bi bi-envelope" aria-hidden="true" />
              {rentalRequest.tenantEmail}
            </a>
            {rentalRequest.tenantPhone && (
              <a href={`tel:${rentalRequest.tenantPhone}`}>
                <i className="bi bi-telephone" aria-hidden="true" />
                {rentalRequest.tenantPhone}
              </a>
            )}
          </div>
        </div>
        <span
          className={`owner-request-status is-${rentalRequest.status}`}
          aria-label={`Status: ${STATUS_LABELS[rentalRequest.status] || rentalRequest.status}`}
        >
          {STATUS_LABELS[rentalRequest.status] || rentalRequest.status}
        </span>
      </header>

      <dl className="owner-request-details">
        <div>
          <dt>
            <i className="bi bi-house-door-fill" aria-hidden="true" />
            Property
          </dt>
          <dd>{rentalRequest.propertyTitle}</dd>
        </div>
        <div>
          <dt>
            <i className="bi bi-geo-alt-fill" aria-hidden="true" />
            Location
          </dt>
          <dd>{rentalRequest.propertyCity}</dd>
        </div>
        <div>
          <dt>
            <i className="bi bi-building" aria-hidden="true" />
            Property type
          </dt>
          <dd>{formatPropertyType(rentalRequest.propertyType)}</dd>
        </div>
        <div>
          <dt>
            <i className="bi bi-cash-stack" aria-hidden="true" />
            Monthly rent
          </dt>
          <dd>{propertyPriceFormatter.format(rentalRequest.propertyPrice)}</dd>
        </div>
        <div>
          <dt>
            <i className="bi bi-calendar-event" aria-hidden="true" />
            Request date
          </dt>
          <dd>{formatPropertyDate(rentalRequest.createdAt)}</dd>
        </div>
      </dl>

      <div className="owner-request-message">
        <span>
          <i className="bi bi-chat-left-text-fill" aria-hidden="true" />
          Tenant message
        </span>
        <p>
          {rentalRequest.message || 'No message was included with this request.'}
        </p>
      </div>

      {isPending && (
        <div className="owner-request-actions">
          <button
            className="btn btn-outline-danger"
            disabled={isDecisionDisabled}
            onClick={() => onDecision(rentalRequest, 'rejected')}
            type="button"
          >
            {isUpdating && pendingStatus === 'rejected' ? (
              <LoadingSpinner label="Rejecting..." />
            ) : (
              <>
                <i className="bi bi-x-circle" aria-hidden="true" />
                Reject
              </>
            )}
          </button>
          <button
            className="btn btn-brand"
            disabled={isDecisionDisabled}
            onClick={() => onDecision(rentalRequest, 'approved')}
            type="button"
          >
            {isUpdating && pendingStatus === 'approved' ? (
              <LoadingSpinner label="Accepting..." />
            ) : (
              <>
                <i className="bi bi-check-circle-fill" aria-hidden="true" />
                Accept
              </>
            )}
          </button>
        </div>
      )}
    </article>
  );
}

export default OwnerRentalRequestCard;
