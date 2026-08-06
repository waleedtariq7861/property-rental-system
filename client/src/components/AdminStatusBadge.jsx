const STATUS_LABELS = Object.freeze({
  active: 'Active',
  admin: 'Admin',
  approved: 'Approved',
  available: 'Available',
  cancelled: 'Cancelled',
  completed: 'Completed',
  deactivated: 'Deactivated',
  owner: 'Owner',
  pending: 'Pending',
  rejected: 'Rejected',
  rented: 'Rented',
  suspended: 'Suspended',
  tenant: 'Tenant',
  unavailable: 'Unavailable',
});

function AdminStatusBadge({ label, status }) {
  const normalizedStatus = String(status || '').toLowerCase();

  return (
    <span className={`admin-status-badge is-${normalizedStatus}`}>
      {label || STATUS_LABELS[normalizedStatus] || status}
    </span>
  );
}

export default AdminStatusBadge;
