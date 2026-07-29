import { useEffect, useState } from 'react';
import {
  DashboardMobileNavigation,
  DashboardSidebar,
} from '../components/DashboardNavigation.jsx';
import DashboardHeader from '../components/DashboardHeader.jsx';
import DashboardLoadingState from '../components/DashboardLoadingState.jsx';
import DashboardStatCards from '../components/DashboardStatCards.jsx';
import OwnerDashboardEmptyState from '../components/OwnerDashboardEmptyState.jsx';
import OwnerPropertyCard from '../components/OwnerPropertyCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getOwnerDashboard } from '../services/ownerDashboardService.js';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js';

function isDashboardResponse(data) {
  const statistics = data?.statistics;

  return (
    data?.owner &&
    Array.isArray(data?.properties) &&
    statistics &&
    ['totalProperties', 'activeListings', 'recentlyAddedProperties'].every(
      (field) => Number.isFinite(Number(statistics[field])),
    )
  );
}

function OwnerDashboard() {
  const { currentUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await getOwnerDashboard({
          signal: controller.signal,
        });

        if (!isDashboardResponse(result.data)) {
          throw new TypeError('The owner dashboard response is invalid.');
        }

        setDashboard(result.data);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setDashboard(null);
        setErrorMessage(
          error instanceof TypeError
            ? 'Dashboard data could not be loaded. Please try again shortly.'
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

  const owner = dashboard?.owner || currentUser;
  const properties = dashboard?.properties || [];

  return (
    <div className="page-shell owner-dashboard-page">
      <div className="owner-dashboard-container">
        <DashboardMobileNavigation />

        <div className="owner-dashboard-layout">
          <DashboardSidebar owner={owner} />

          <div className="owner-dashboard-main">
            <DashboardHeader owner={owner} />

            {isLoading && <DashboardLoadingState />}

            {!isLoading && errorMessage && (
              <div className="owner-dashboard-state owner-dashboard-error-state" role="alert">
                <span className="owner-dashboard-state-icon" aria-hidden="true">
                  <i className="bi bi-exclamation-triangle" />
                </span>
                <h2>We could not load your dashboard</h2>
                <p>{errorMessage}</p>
                <button
                  className="btn btn-brand"
                  onClick={() => setRequestKey((currentKey) => currentKey + 1)}
                  type="button"
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoading && dashboard && (
              <>
                <DashboardStatCards statistics={dashboard.statistics} />

                <section
                  className="owner-properties-section"
                  id="my-properties"
                  aria-labelledby="my-properties-heading"
                >
                  <div className="owner-section-heading">
                    <div>
                      <span className="section-label">Your portfolio</span>
                      <h2 id="my-properties-heading">My Properties</h2>
                    </div>
                    <span className="owner-property-count">
                      {properties.length}{' '}
                      {properties.length === 1 ? 'property' : 'properties'}
                    </span>
                  </div>

                  {properties.length === 0 ? (
                    <OwnerDashboardEmptyState />
                  ) : (
                    <div className="owner-property-grid">
                      {properties.map((property) => (
                        <OwnerPropertyCard key={property.id} property={property} />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
