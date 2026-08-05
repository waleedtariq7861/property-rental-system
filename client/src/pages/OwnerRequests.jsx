import { useEffect, useMemo, useState } from 'react';
import {
  DashboardMobileNavigation,
  DashboardSidebar,
} from '../components/DashboardNavigation.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import OwnerRentalRequestCard from '../components/OwnerRentalRequestCard.jsx';
import RentalRequestToolbar from '../components/RentalRequestToolbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getOwnerRentalRequests,
  updateOwnerRentalRequestStatus,
} from '../services/rentalRequestService.js';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js';

const OWNER_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

function isOwnerRequestsResponse(data) {
  return (
    Array.isArray(data?.rentalRequests) &&
    data.rentalRequests.every(
      (rentalRequest) =>
        Number.isFinite(Number(rentalRequest?.id)) &&
        typeof rentalRequest?.tenantName === 'string' &&
        typeof rentalRequest?.tenantEmail === 'string' &&
        typeof rentalRequest?.propertyTitle === 'string' &&
        typeof rentalRequest?.propertyCity === 'string' &&
        Number.isFinite(Number(rentalRequest?.propertyPrice)) &&
        typeof rentalRequest?.propertyType === 'string' &&
        typeof rentalRequest?.status === 'string' &&
        typeof rentalRequest?.createdAt === 'string',
    )
  );
}

function OwnerRequests() {
  const { currentUser } = useAuth();
  const [rentalRequests, setRentalRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [requestKey, setRequestKey] = useState(0);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rentalRequests.filter((rentalRequest) => {
      const matchesStatus =
        statusFilter === 'all' || rentalRequest.status === statusFilter;
      const searchableContent = [
        rentalRequest.tenantName,
        rentalRequest.tenantEmail,
        rentalRequest.tenantPhone,
        rentalRequest.propertyTitle,
        rentalRequest.propertyCity,
        rentalRequest.propertyType,
        rentalRequest.message,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && searchableContent.includes(normalizedSearch);
    });
  }, [rentalRequests, searchTerm, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRentalRequests() {
      setIsLoading(true);
      setLoadError('');

      try {
        const result = await getOwnerRentalRequests({
          signal: controller.signal,
        });

        if (!isOwnerRequestsResponse(result.data)) {
          throw new TypeError('The owner rental request response is invalid.');
        }

        setRentalRequests(result.data.rentalRequests);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setRentalRequests([]);
        setLoadError(
          error instanceof TypeError
            ? 'Rental requests could not be loaded. Please try again shortly.'
            : getApiErrorMessage(error),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadRentalRequests();
    return () => controller.abort();
  }, [requestKey]);

  async function handleDecision(rentalRequest, status) {
    if (updatingRequestId !== null || rentalRequest.status !== 'pending') {
      return;
    }

    setUpdatingRequestId(rentalRequest.id);
    setPendingStatus(status);
    setFeedback(null);

    try {
      const result = await updateOwnerRentalRequestStatus(
        rentalRequest.id,
        status,
      );
      const updatedRequest = result.data?.rentalRequest;

      if (!updatedRequest || updatedRequest.id !== rentalRequest.id) {
        throw new TypeError('The updated rental request response is invalid.');
      }

      setRentalRequests((currentRequests) =>
        currentRequests.map((currentRequest) =>
          currentRequest.id === updatedRequest.id
            ? updatedRequest
            : currentRequest,
        ),
      );
      setFeedback({
        type: 'success',
        message:
          result.message ||
          `Rental request ${status === 'approved' ? 'accepted' : 'rejected'} successfully.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof TypeError
            ? 'The request was updated, but the latest status could not be displayed.'
            : getApiErrorMessage(error),
      });
    } finally {
      setUpdatingRequestId(null);
      setPendingStatus('');
    }
  }

  return (
    <div className="page-shell owner-dashboard-page">
      <div className="owner-dashboard-container">
        <DashboardMobileNavigation />

        <div className="owner-dashboard-layout">
          <DashboardSidebar owner={currentUser} />

          <div className="owner-dashboard-main">
            <header className="owner-dashboard-header owner-requests-header">
              <div>
                <span className="owner-dashboard-eyebrow">
                  <i className="bi bi-inbox-fill" aria-hidden="true" />
                  Request inbox
                </span>
                <h1>Rental Requests</h1>
                <p>
                  Review tenant interest for your properties and make a clear
                  decision on every pending request.
                </p>
              </div>
              <div className="owner-dashboard-header-mark" aria-hidden="true">
                <i className="bi bi-person-check-fill" />
              </div>
            </header>

            {feedback && (
              <div
                className={`owner-request-notification is-${feedback.type}`}
                role={feedback.type === 'error' ? 'alert' : 'status'}
              >
                <i
                  className={`bi ${
                    feedback.type === 'success'
                      ? 'bi-check-circle-fill'
                      : 'bi-exclamation-triangle-fill'
                  }`}
                  aria-hidden="true"
                />
                <span>{feedback.message}</span>
                <button
                  aria-label="Dismiss message"
                  className="btn-close"
                  onClick={() => setFeedback(null)}
                  type="button"
                />
              </div>
            )}

            {isLoading && (
              <div className="owner-dashboard-state" aria-live="polite">
                <span className="owner-dashboard-state-icon" aria-hidden="true">
                  <i className="bi bi-inbox" />
                </span>
                <LoadingSpinner label="Loading rental requests..." />
                <p>Gathering requests for your properties.</p>
              </div>
            )}

            {!isLoading && loadError && (
              <div
                className="owner-dashboard-state owner-dashboard-error-state"
                role="alert"
              >
                <span className="owner-dashboard-state-icon" aria-hidden="true">
                  <i className="bi bi-exclamation-triangle" />
                </span>
                <h2>We could not load your rental requests</h2>
                <p>{loadError}</p>
                <button
                  className="btn btn-brand"
                  onClick={() => setRequestKey((currentKey) => currentKey + 1)}
                  type="button"
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoading && !loadError && (
              <section aria-labelledby="owner-requests-heading">
                <div className="owner-section-heading">
                  <div>
                    <span className="section-label">Tenant interest</span>
                    <h2 id="owner-requests-heading">Property Requests</h2>
                  </div>
                  <span className="owner-property-count">
                    {filteredRequests.length}{' '}
                    {filteredRequests.length === 1 ? 'request' : 'requests'}
                  </span>
                </div>

                {rentalRequests.length === 0 ? (
                  <div className="owner-dashboard-state">
                    <span
                      className="owner-dashboard-state-icon"
                      aria-hidden="true"
                    >
                      <i className="bi bi-envelope-open" />
                    </span>
                    <h3>No rental requests yet</h3>
                    <p>
                      New tenant requests for your properties will appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    <RentalRequestToolbar
                      idPrefix="owner-requests"
                      onClear={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      onSearchChange={setSearchTerm}
                      onStatusChange={setStatusFilter}
                      resultCount={filteredRequests.length}
                      searchPlaceholder="Search tenant, property, city, or message"
                      searchTerm={searchTerm}
                      statusFilter={statusFilter}
                      statusOptions={OWNER_STATUS_OPTIONS}
                      totalCount={rentalRequests.length}
                    />

                    {filteredRequests.length === 0 ? (
                      <div className="owner-dashboard-state rental-request-filter-empty">
                        <span
                          className="owner-dashboard-state-icon"
                          aria-hidden="true"
                        >
                          <i className="bi bi-search" />
                        </span>
                        <h3>No matching requests</h3>
                        <p>
                          Try another tenant, property, or request status.
                        </p>
                        <button
                          className="btn btn-brand"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                          }}
                          type="button"
                        >
                          Clear filters
                        </button>
                      </div>
                    ) : (
                      <div className="owner-request-grid">
                        {filteredRequests.map((rentalRequest) => (
                          <OwnerRentalRequestCard
                            isDecisionDisabled={updatingRequestId !== null}
                            isUpdating={updatingRequestId === rentalRequest.id}
                            key={rentalRequest.id}
                            onDecision={handleDecision}
                            pendingStatus={pendingStatus}
                            rentalRequest={rentalRequest}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerRequests;
