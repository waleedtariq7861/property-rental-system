import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createRentalRequest } from '../services/rentalRequestService.js';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js';
import LoadingSpinner from './LoadingSpinner.jsx';

const DUPLICATE_REQUEST_STATUS = 409;
const DUPLICATE_REQUEST_MESSAGE =
  'You already have a pending rental request for this property.';

function RentalRequestPanel({ property }) {
  const { currentUser, isAuthenticated, isRestoring } = useAuth();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const hasSubmitted = feedback?.type === 'success';

  useEffect(() => {
    setMessage('');
    setIsSubmitting(false);
    setFeedback(null);
  }, [property.id]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting || hasSubmitted || currentUser?.role !== 'tenant') {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await createRentalRequest({
        propertyId: property.id,
        message: message.trim(),
      });

      setFeedback({
        type: 'success',
        message: result.message || 'Rental request sent successfully.',
      });
    } catch (error) {
      const errorMessage = getApiErrorMessage(error);
      const isDuplicateRequest =
        error.response?.status === DUPLICATE_REQUEST_STATUS &&
        errorMessage === DUPLICATE_REQUEST_MESSAGE;

      setFeedback({
        type: isDuplicateRequest ? 'duplicate' : 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isRestoring) {
    return (
      <section className="rental-request-panel" aria-label="Rental request">
        <LoadingSpinner label="Checking rental request access..." />
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section
        className="rental-request-panel"
        aria-labelledby="rental-request-heading"
      >
        <span className="property-control-kicker">Interested in this home?</span>
        <h2 className="h5" id="rental-request-heading">
          Send a Rental Request
        </h2>
        <p>Log in with a tenant account to contact the property owner.</p>
        <Link
          className="btn btn-brand w-100"
          state={{ from: `/properties/${property.id}` }}
          to="/login"
        >
          Log in to Send Request
        </Link>
      </section>
    );
  }

  if (currentUser.role !== 'tenant') {
    return (
      <section
        className="rental-request-panel"
        aria-labelledby="rental-request-heading"
      >
        <span className="property-control-kicker">Rental requests</span>
        <h2 className="h5" id="rental-request-heading">
          Tenant access only
        </h2>
        <p>
          Rental requests can only be sent from an authenticated tenant account.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rental-request-panel"
      aria-labelledby="rental-request-heading"
    >
      <span className="property-control-kicker">Interested in this home?</span>
      <h2 className="h5" id="rental-request-heading">
        Send a Rental Request
      </h2>
      <p>Introduce yourself to the owner. A short message is optional.</p>

      <form onSubmit={handleSubmit}>
        <label className="form-label" htmlFor="rental-request-message">
          Message to property owner (optional)
        </label>
        <textarea
          className="form-control"
          disabled={isSubmitting || hasSubmitted}
          id="rental-request-message"
          maxLength="1000"
          onChange={(event) => {
            setMessage(event.target.value);
            setFeedback(null);
          }}
          placeholder="Share your preferred move-in timing or ask a quick question."
          rows="4"
          value={message}
        />
        <small>{message.length}/1000 characters</small>

        {feedback && (
          <div
            className={`rental-request-feedback is-${feedback.type}`}
            role={feedback.type === 'success' ? 'status' : 'alert'}
          >
            <i
              className={`bi ${
                feedback.type === 'success'
                  ? 'bi-check-circle-fill'
                  : feedback.type === 'duplicate'
                    ? 'bi-info-circle-fill'
                    : 'bi-exclamation-triangle-fill'
              }`}
              aria-hidden="true"
            />
            <span>{feedback.message}</span>
          </div>
        )}

        <button
          className="btn btn-brand w-100"
          disabled={isSubmitting || hasSubmitted}
          type="submit"
        >
          {isSubmitting && (
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />
          )}
          {isSubmitting
            ? 'Sending Request...'
            : hasSubmitted
              ? 'Request Sent'
              : 'Send Rental Request'}
        </button>
      </form>
    </section>
  );
}

export default RentalRequestPanel;
