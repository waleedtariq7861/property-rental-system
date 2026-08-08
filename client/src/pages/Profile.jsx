import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_LABELS = {
  tenant: 'Tenant',
  owner: 'Property Owner',
  admin: 'Administrator',
};

function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <section className="page-shell section-space">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="content-card profile-card">
              <span className="section-label">Secure account profile</span>
              <h1 className="display-6 fw-bold mt-2 mb-3">Your RentEase profile</h1>
              <p className="section-intro mb-4">
                This information was restored from the authenticated backend
                profile endpoint. Passwords and password hashes are never shown.
              </p>

              {location.state?.successMessage && (
                <div className="alert alert-success" role="status">
                  {location.state.successMessage}
                </div>
              )}

              <dl className="profile-details">
                <div>
                  <dt>User ID</dt>
                  <dd>{currentUser.id}</dd>
                </div>
                <div>
                  <dt>Full name</dt>
                  <dd>{currentUser.fullName}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{currentUser.email}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{ROLE_LABELS[currentUser.role] || currentUser.role}</dd>
                </div>
              </dl>

              <div className="d-flex flex-wrap gap-3 mt-4">
                {currentUser.role === 'owner' && (
                  <>
                    <Link className="btn btn-brand" to="/owner/dashboard">
                      Open owner dashboard
                    </Link>
                    <Link className="btn btn-outline-brand" to="/owner-access">
                      Verify owner access
                    </Link>
                  </>
                )}
                {currentUser.role === 'admin' && (
                  <Link className="btn btn-outline-brand" to="/admin-access">
                    Verify admin access
                  </Link>
                )}
                <button className="btn btn-brand" onClick={handleLogout} type="button">
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Profile;
