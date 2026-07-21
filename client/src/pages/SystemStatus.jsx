import { useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { getHealthStatus } from '../services/healthService.js';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js';

function SystemStatus() {
  const [health, setHealth] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHealth() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await getHealthStatus({ signal: controller.signal });
        setHealth(result);
      } catch (error) {
        if (error.code === 'ERR_CANCELED') {
          return;
        }

        setHealth(error.response?.data || null);
        setErrorMessage(getApiErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadHealth();
    return () => controller.abort();
  }, [refreshCount]);

  const databaseConnected = health?.data?.database === 'connected';
  const apiOnline = Boolean(health?.success);

  return (
    <section className="page-shell section-space">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="content-card">
              <span className="section-label">Development only</span>
              <h1 className="display-6 fw-bold mt-2 mb-3">System status</h1>
              <p className="section-intro mb-4">
                This private page keeps the backend health integration available
                for development without placing it on the public homepage.
              </p>

              {isLoading ? (
                <LoadingSpinner label="Checking backend health…" />
              ) : (
                <>
                  <div className="status-list mb-3">
                    <div className="status-row">
                      <span>API</span>
                      <strong>{apiOnline ? 'Online' : 'Unavailable'}</strong>
                    </div>
                    <div className="status-row">
                      <span>Database</span>
                      <strong>{databaseConnected ? 'Connected' : 'Unavailable'}</strong>
                    </div>
                  </div>

                  {!apiOnline && errorMessage && (
                    <div className="alert alert-warning mb-3" role="alert">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    className="btn btn-brand"
                    type="button"
                    onClick={() => setRefreshCount((value) => value + 1)}
                  >
                    Refresh status
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SystemStatus;
