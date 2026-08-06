import { formatPropertyDate } from '../utils/propertyFormatting.js';
import AdminStatusBadge from './AdminStatusBadge.jsx';

function EmptyRecentState({ label }) {
  return <p className="admin-recent-empty">No recent {label} to display.</p>;
}

function AdminRecentPanels({ users, properties, rentalRequests }) {
  return (
    <section className="admin-recent-grid" aria-label="Recent RentEase activity">
      <article className="admin-recent-panel">
        <header>
          <span aria-hidden="true"><i className="bi bi-person-plus-fill" /></span>
          <div>
            <small>Account activity</small>
            <h3>Recent Users</h3>
          </div>
        </header>
        {users.length === 0 ? (
          <EmptyRecentState label="users" />
        ) : (
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                <span className="admin-recent-avatar" aria-hidden="true">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <strong>{user.fullName}</strong>
                  <span>{user.email}</span>
                </div>
                <div className="admin-recent-meta">
                  <AdminStatusBadge status={user.role} />
                  <time dateTime={user.createdAt}>
                    {formatPropertyDate(user.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="admin-recent-panel">
        <header>
          <span aria-hidden="true"><i className="bi bi-house-add-fill" /></span>
          <div>
            <small>Listing activity</small>
            <h3>Recent Properties</h3>
          </div>
        </header>
        {properties.length === 0 ? (
          <EmptyRecentState label="properties" />
        ) : (
          <ul>
            {properties.map((property) => (
              <li key={property.id}>
                <span className="admin-recent-icon" aria-hidden="true">
                  <i className="bi bi-building" />
                </span>
                <div>
                  <strong>{property.title}</strong>
                  <span>{property.city} · {property.ownerName}</span>
                </div>
                <div className="admin-recent-meta">
                  <AdminStatusBadge status={property.availabilityStatus} />
                  <time dateTime={property.createdAt}>
                    {formatPropertyDate(property.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="admin-recent-panel">
        <header>
          <span aria-hidden="true"><i className="bi bi-send-fill" /></span>
          <div>
            <small>Rental activity</small>
            <h3>Recent Requests</h3>
          </div>
        </header>
        {rentalRequests.length === 0 ? (
          <EmptyRecentState label="requests" />
        ) : (
          <ul>
            {rentalRequests.map((rentalRequest) => (
              <li key={rentalRequest.id}>
                <span className="admin-recent-icon" aria-hidden="true">
                  <i className="bi bi-file-earmark-text" />
                </span>
                <div>
                  <strong>{rentalRequest.propertyTitle}</strong>
                  <span>{rentalRequest.tenantName} → {rentalRequest.ownerName}</span>
                </div>
                <div className="admin-recent-meta">
                  <AdminStatusBadge
                    label={
                      rentalRequest.status === 'approved'
                        ? 'Accepted'
                        : undefined
                    }
                    status={rentalRequest.status}
                  />
                  <time dateTime={rentalRequest.createdAt}>
                    {formatPropertyDate(rentalRequest.createdAt)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}

export default AdminRecentPanels;
