function OwnerDashboardEmptyState() {
  return (
    <div className="owner-dashboard-state owner-dashboard-empty-state">
      <span className="owner-dashboard-state-icon" aria-hidden="true">
        <i className="bi bi-house-dash" />
      </span>
      <h3>No properties yet</h3>
      <p>
        Your property portfolio is currently empty. Properties you create in a
        future management phase will appear here automatically.
      </p>
    </div>
  );
}

export default OwnerDashboardEmptyState;
