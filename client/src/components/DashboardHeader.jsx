import { Link } from 'react-router-dom';

function DashboardHeader({ owner }) {
  return (
    <header className="owner-dashboard-header">
      <div>
        <span className="owner-dashboard-eyebrow">
          <i className="bi bi-grid-1x2-fill" aria-hidden="true" />
          Owner workspace
        </span>
        <h1>Welcome back, {owner.fullName}</h1>
        <p>
          Here is a clear view of your RentEase property portfolio and listing
          activity.
        </p>
        <Link
          className="btn btn-brand-light owner-dashboard-add-link"
          to="/owner/properties/add"
        >
          <i className="bi bi-plus-circle-fill" aria-hidden="true" />
          Add Property
        </Link>
      </div>
      <div className="owner-dashboard-header-mark" aria-hidden="true">
        <i className="bi bi-buildings-fill" />
      </div>
    </header>
  );
}

export default DashboardHeader;
