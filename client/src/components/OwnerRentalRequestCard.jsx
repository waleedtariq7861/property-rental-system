import LoadingSpinner from './LoadingSpinner.jsx';
import { formatPropertyDate } from '../utils/propertyFormatting.js';

const STATUS_LABELS = Object.freeze({
  pending: 'Pending',
  approved: 'Approved',
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
