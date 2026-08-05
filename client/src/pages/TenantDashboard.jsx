import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import RentalRequestToolbar from '../components/RentalRequestToolbar.jsx';
import TenantRecentActivity from '../components/TenantRecentActivity.jsx';
import TenantRentalRequestCard from '../components/TenantRentalRequestCard.jsx';
import TenantRequestSummary from '../components/TenantRequestSummary.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  cancelRentalRequest,
  getMyRentalRequests,
} from '../services/rentalRequestService.js';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js';

const KNOWN_REQUEST_STATUSES = new Set([
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'completed',
]);

const TENANT_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

function isTenantDashboardResponse(data) {
  return (
    Array.isArray(data?.rentalRequests) &&
    data.rentalRequests.every(
      (rentalRequest) =>
        Number.isFinite(Number(rentalRequest?.id)) &&
        typeof rentalRequest?.propertyTitle === 'string' &&
        typeof rentalRequest?.propertyCity === 'string' &&
        Number.isFinite(Number(rentalRequest?.propertyPrice)) &&
        typeof rentalRequest?.ownerName === 'string' &&
        KNOWN_REQUEST_STATUSES.has(rentalRequest?.status) &&
        typeof rentalRequest?.createdAt === 'string',
    )
  );
}

function getRequestStatistics(rentalRequests) {
  return rentalRequests.reduce(
    (statistics, rentalRequest) => {
      statistics.totalRequests += 1;

      if (rentalRequest.status === 'pending') {
        statistics.pendingRequests += 1;
      } else if (rentalRequest.status === 'approved') {
        statistics.acceptedRequests += 1;
      } else if (rentalRequest.status === 'rejected') {
        statistics.rejectedRequests += 1;
      }

      return statistics;
    },
    {
      totalRequests: 0,
      pendingRequests: 0,
      acceptedRequests: 0,
      rejectedRequests: 0,
    },
  );
}

function TenantDashboard() {
  const { currentUser } = useAuth();
  const [rentalRequests, setRentalRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [requestKey, setRequestKey] = useState(0);
  const [cancellingRequestId, setCancellingRequestId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const statistics = useMemo(
    () => getRequestStatistics(rentalRequests),
    [rentalRequests],
  );
  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return rentalRequests.filter((rentalRequest) => {
      const matchesStatus =
        statusFilter === 'all' || rentalRequest.status === statusFilter;
      const searchableContent = [
        rentalRequest.propertyTitle,
        rentalRequest.propertyCity,
        rentalRequest.propertyType,
        rentalRequest.ownerName,
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

    async function loadDashboard() {
      setIsLoading(true);
      setLoadError('');

      try {
        const result = await getMyRentalRequests({
          signal: controller.signal,
        });

        if (!isTenantDashboardResponse(result.data)) {
          throw new TypeError('The tenant dashboard response is invalid.');
        }

        setRentalRequests(result.data.rentalRequests);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setRentalRequests([]);
        setLoadError(
          error instanceof TypeError
            ? 'Your rental requests could not be loaded. Please try again shortly.'
            : getApiErrorMessage(error),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, [requestKey]);

  async function handleCancel(rentalRequest) {
    if (cancellingRequestId !== null || rentalRequest.status !== 'pending') {
      return;
    }

    setCancellingRequestId(rentalRequest.id);
    setFeedback(null);

    try {
      const result = await cancelRentalRequest(rentalRequest.id);
      const cancelledRequest = result.data?.rentalRequest;

      if (
        !cancelledRequest ||
        Number(cancelledRequest.id) !== Number(rentalRequest.id) ||
        cancelledRequest.status !== 'cancelled'
      ) {
        throw new TypeError('The cancelled rental request response is invalid.');
      }

      setRentalRequests((currentRequests) =>
        currentRequests.map((currentRequest) =>
          Number(currentRequest.id) === Number(cancelledRequest.id)
            ? cancelledRequest
            : currentRequest,
        ),
      );
      setFeedback({
        type: 'success',
        message: result.message || 'Rental request cancelled successfully.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof TypeError
            ? 'The request was cancelled, but its latest status could not be displayed.'
            : getApiErrorMessage(error),
      });
    } finally {
      setCancellingRequestId(null);
    }
  }

  return (
    <div className="page-shell tenant-dashboard-page">
      <div className="tenant-dashboard-container">
        <header className="tenant-dashboard-header">
          <div>
            <span className="tenant-dashboard-eyebrow">
              <i className="bi bi-person-check-fill" aria-hidden="true" />
              Tenant workspace
            </span>
            <h1>Welcome, {currentUser.fullName}</h1>
            <p>
              Track every rental request and stay up to date as property owners
              review your interest.
            </p>
          </div>
          <Link className="btn btn-brand-light" to="/properties">
            <i className="bi bi-search" aria-hidden="true" />
            Browse Properties
          </Link>
        </header>

        {feedback && (
          <div
            className={`tenant-dashboard-notification is-${feedback.type}`}
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
          <div className="tenant-dashboard-state" aria-live="polite">
            <span className="tenant-dashboard-state-icon" aria-hidden="true">
              <i className="bi bi-send" />
            </span>
            <LoadingSpinner label="Loading your rental dashboard..." />
            <p>Gathering your latest rental request activity.</p>
          </div>
        )}

        {!isLoading && loadError && (
          <div
            className="tenant-dashboard-state is-error"
            role="alert"
          >
            <span className="tenant-dashboard-state-icon" aria-hidden="true">
              <i className="bi bi-exclamation-triangle" />
            </span>
            <h2>We could not load your dashboard</h2>
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
          <>
            <TenantRequestSummary statistics={statistics} />

            <TenantRecentActivity rentalRequests={rentalRequests} />

            <section
              className="tenant-requests-section"
              aria-labelledby="tenant-requests-heading"
            >
              <div className="tenant-section-heading">
                <div>
                  <span>Request history</span>
                  <h2 id="tenant-requests-heading">My Rental Requests</h2>
                </div>
                <strong>
                  {filteredRequests.length}{' '}
                  {filteredRequests.length === 1 ? 'request' : 'requests'}
                </strong>
              </div>

              {rentalRequests.length === 0 ? (
                <div className="tenant-dashboard-state">
                  <span
                    className="tenant-dashboard-state-icon"
                    aria-hidden="true"
                  >
                    <i className="bi bi-house-heart" />
                  </span>
                  <h3>No rental requests yet</h3>
                  <p>
                    Explore available properties and send a request when you
                    find the right home.
                  </p>
                  <Link className="btn btn-brand" to="/properties">
                    Browse Properties
                  </Link>
                </div>
              ) : (
                <>
                  <RentalRequestToolbar
                    idPrefix="tenant-requests"
                    onClear={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    onSearchChange={setSearchTerm}
                    onStatusChange={setStatusFilter}
                    resultCount={filteredRequests.length}
                    searchPlaceholder="Search property, city, owner, or message"
                    searchTerm={searchTerm}
                    statusFilter={statusFilter}
                    statusOptions={TENANT_STATUS_OPTIONS}
                    totalCount={rentalRequests.length}
                  />

                  {filteredRequests.length === 0 ? (
                    <div className="tenant-dashboard-state rental-request-filter-empty">
                      <span
                        className="tenant-dashboard-state-icon"
                        aria-hidden="true"
                      >
                        <i className="bi bi-search" />
                      </span>
                      <h3>No matching requests</h3>
                      <p>Try another property, owner, city, or request status.</p>
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
                    <div className="tenant-request-grid">
                      {filteredRequests.map((rentalRequest) => (
                        <TenantRentalRequestCard
                          isActionDisabled={cancellingRequestId !== null}
                          isCancelling={
                            Number(cancellingRequestId) ===
                            Number(rentalRequest.id)
                          }
                          key={rentalRequest.id}
                          onCancel={handleCancel}
                          rentalRequest={rentalRequest}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default TenantDashboard;
