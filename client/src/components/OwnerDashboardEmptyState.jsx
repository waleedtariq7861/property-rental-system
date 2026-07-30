import { Link } from 'react-router-dom';

function OwnerDashboardEmptyState() {
  return (
    <div className="owner-dashboard-state owner-dashboard-empty-state">
      <span className="owner-dashboard-state-icon" aria-hidden="true">
        <i className="bi bi-house-dash" />
      </span>
      <h3>No properties yet</h3>
      <p>
        Your property portfolio is currently empty. Add your first listing and
        it will appear here automatically.
      </p>
      <Link className="btn btn-brand" to="/owner/properties/add">
        <i className="bi bi-plus-circle-fill me-2" aria-hidden="true" />
        Add your first property
      </Link>
    </div>
  );
}

export default OwnerDashboardEmptyState;
