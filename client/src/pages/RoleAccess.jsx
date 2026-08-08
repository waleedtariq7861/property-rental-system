import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { getRoleTest } from '../services/authService.js';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js';

const ROLE_LABELS = {
  owner: 'Property Owner',
  admin: 'Administrator',
};

function RoleAccess({ role }) {
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function verifyRoleAccess() {
      try {
        const response = await getRoleTest(role, {
          signal: controller.signal,
        });
        setResult(response);
      } catch (error) {
        if (error.code !== 'ERR_CANCELED') {
          setErrorMessage(getApiErrorMessage(error));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    verifyRoleAccess();
    return () => controller.abort();
  }, [role]);

  return (
    <section className="page-shell section-space">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="content-card">
              <span className="section-label">Role authorization</span>
              <h1 className="display-6 fw-bold mt-2 mb-3">
                {ROLE_LABELS[role]} access
              </h1>

              {isLoading && <LoadingSpinner label="Verifying role access..." />}

              {!isLoading && result && (
                <div className="alert alert-success" role="status">
                  {result.message}
                </div>
              )}

              {!isLoading && errorMessage && (
                <div className="alert alert-danger" role="alert">
                  {errorMessage}
                </div>
              )}

              <Link className="btn btn-outline-brand mt-3" to="/profile">
                Back to profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RoleAccess;
