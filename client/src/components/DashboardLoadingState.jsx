import LoadingSpinner from './LoadingSpinner.jsx';

function DashboardLoadingState() {
  return (
    <div className="owner-dashboard-state owner-dashboard-loading-state" aria-live="polite">
      <span className="owner-dashboard-state-icon" aria-hidden="true">
        <i className="bi bi-buildings" />
      </span>
      <LoadingSpinner label="Loading your dashboard..." />
      <p>Gathering your latest property and listing information.</p>
    </div>
  );
}

export default DashboardLoadingState;
