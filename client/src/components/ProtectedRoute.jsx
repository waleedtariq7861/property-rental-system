import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

function ProtectedRoute({ allowedRoles = [] }) {
  const location = useLocation();
  const { currentUser, isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <section className="route-loading-section">
        <LoadingSpinner label="Restoring your session..." />
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        state={{ from: `${location.pathname}${location.search}` }}
        to="/login"
      />
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return (
      <Navigate
        replace
        state={{ from: location.pathname }}
        to="/unauthorized"
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
