import {
  formatPropertyDate,
  formatPropertyType,
  propertyPriceFormatter,
} from '../utils/propertyFormatting.js';
import AdminStatusBadge from './AdminStatusBadge.jsx';

function TableEmptyState({ message }) {
  return (
    <div className="admin-table-empty">
      <i className="bi bi-inbox" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

function AdminTableActions({ children }) {
  return <div className="admin-table-actions">{children}</div>;
}

function DetailButton({ label, onClick }) {
  return (
    <button
      aria-label={label}
      className="admin-table-action is-view"
      onClick={onClick}
      type="button"
    >
      <i className="bi bi-eye-fill" aria-hidden="true" />
      Details
    </button>
  );
}

export function AdminUsersTable({
  activeAction,
  currentAdminId,
  onChangeStatus,
  onDelete,
  onViewDetails,
  users,
}) {
  if (users.length === 0) {
    return <TableEmptyState message="No users match the selected criteria." />;
  }

  return (
    <div className="admin-table-scroll">
      <table className="admin-data-table">
        <caption className="visually-hidden">All RentEase users</caption>
        <thead>
          <tr>
            <th scope="col">User</th>
            <th scope="col">Contact</th>
            <th scope="col">Role</th>
            <th scope="col">Account Status</th>
            <th scope="col">Joined</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isCurrentAdmin = Number(user.id) === Number(currentAdminId);
            const hasHistory =
              Number(user.propertyCount || 0) > 0 ||
              Number(user.rentalRequestCount || 0) > 0;
            const nextStatus =
              user.accountStatus === 'active' ? 'deactivated' : 'active';
            const isUpdating = activeAction === `user-status-${user.id}`;

            return (
              <tr key={user.id}>
                <td>
                  <div className="admin-table-identity">
                    <span aria-hidden="true">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <strong>{user.fullName}</strong>
                      <small>User #{user.id}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{user.email}</strong>
                  <small>{user.phone || 'No phone provided'}</small>
                </td>
                <td><AdminStatusBadge status={user.role} /></td>
                <td><AdminStatusBadge status={user.accountStatus} /></td>
                <td>
                  <time dateTime={user.createdAt}>
                    {formatPropertyDate(user.createdAt)}
                  </time>
                </td>
                <td>
                  <AdminTableActions>
                    <DetailButton
                      label={`View ${user.fullName}`}
                      onClick={() => onViewDetails(user)}
                    />
                    <button
                      aria-label={`${nextStatus === 'active' ? 'Activate' : 'Deactivate'} ${user.fullName}`}
                      className="admin-table-action is-status"
                      disabled={isCurrentAdmin || Boolean(activeAction)}
                      onClick={() => onChangeStatus(user, nextStatus)}
                      title={
                        isCurrentAdmin
                          ? 'Your current administrator session is protected.'
                          : undefined
                      }
                      type="button"
                    >
                      <i
                        className={`bi ${nextStatus === 'active' ? 'bi-person-check-fill' : 'bi-person-dash-fill'}`}
                        aria-hidden="true"
                      />
                      {isUpdating
                        ? 'Updating...'
                        : nextStatus === 'active' ? 'Activate' : 'Deactivate'}
                    </button>
                    <button
                      aria-label={`Delete ${user.fullName}`}
                      className="admin-table-action is-delete"
                      disabled={isCurrentAdmin || hasHistory || Boolean(activeAction)}
                      onClick={() => onDelete(user)}
                      title={
                        isCurrentAdmin
                          ? 'Your current administrator account cannot be deleted.'
                          : hasHistory
                            ? 'Users with property or rental history must be deactivated.'
                            : undefined
                      }
                      type="button"
                    >
                      <i className="bi bi-trash3-fill" aria-hidden="true" />
                      Delete
                    </button>
                    {(isCurrentAdmin || hasHistory) && (
                      <span className="admin-table-action-note">
                        <i className="bi bi-shield-lock-fill" aria-hidden="true" />
                        {isCurrentAdmin ? 'Current admin protected' : 'History protected'}
                      </span>
                    )}
                  </AdminTableActions>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminPropertiesTable({
  activeAction,
  onDelete,
  onViewDetails,
  properties,
}) {
  if (properties.length === 0) {
    return (
      <TableEmptyState message="No properties match the selected criteria." />
    );
  }

  return (
    <div className="admin-table-scroll">
      <table className="admin-data-table admin-property-table">
        <caption className="visually-hidden">All RentEase properties</caption>
        <thead>
          <tr>
            <th scope="col">Property</th>
            <th scope="col">Owner</th>
            <th scope="col">Location</th>
            <th scope="col">Rent</th>
            <th scope="col">Property Details</th>
            <th scope="col">Listing Status</th>
            <th scope="col">Added</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => {
            const hasRentalHistory = Number(property.rentalRequestCount || 0) > 0;

            return (
              <tr key={property.id}>
                <td>
                  <strong>{property.title}</strong>
                  <small>
                    #{property.id} · {formatPropertyType(property.propertyType)}
                  </small>
                </td>
                <td>
                  <strong>{property.ownerName}</strong>
                  <small>{property.ownerEmail}</small>
                </td>
                <td>
                  <strong>{property.city} · {property.area}</strong>
                  <small>{property.address}</small>
                </td>
                <td>
                  <strong>{propertyPriceFormatter.format(property.price)}</strong>
                  <small>
                    Deposit: {propertyPriceFormatter.format(property.securityDeposit)}
                  </small>
                </td>
                <td>
                  <strong>
                    {property.bedrooms} bed · {property.bathrooms} bath
                  </strong>
                  <small>
                    {formatPropertyType(property.furnishedStatus)} ·{' '}
                    {Number(property.parkingAvailable) ? 'Parking' : 'No parking'}
                  </small>
                </td>
                <td>
                  <div className="admin-table-statuses">
                    <AdminStatusBadge status={property.availabilityStatus} />
                    <AdminStatusBadge status={property.approvalStatus} />
                  </div>
                </td>
                <td>
                  <time dateTime={property.createdAt}>
                    {formatPropertyDate(property.createdAt)}
                  </time>
                </td>
                <td>
                  <AdminTableActions>
                    <DetailButton
                      label={`View ${property.title}`}
                      onClick={() => onViewDetails(property)}
                    />
                    <button
                      aria-label={`Delete ${property.title}`}
                      className="admin-table-action is-delete"
                      disabled={hasRentalHistory || Boolean(activeAction)}
                      onClick={() => onDelete(property)}
                      title={
                        hasRentalHistory
                          ? 'Properties with rental history are protected from deletion.'
                          : undefined
                      }
                      type="button"
                    >
                      <i className="bi bi-trash3-fill" aria-hidden="true" />
                      Delete
                    </button>
                    {hasRentalHistory && (
                      <span className="admin-table-action-note">
                        <i className="bi bi-shield-lock-fill" aria-hidden="true" />
                        Rental history protected
                      </span>
                    )}
                  </AdminTableActions>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminRentalRequestsTable({ onViewDetails, rentalRequests }) {
  if (rentalRequests.length === 0) {
    return <TableEmptyState message="No rental requests are available." />;
  }

  return (
    <div className="admin-table-scroll">
      <table className="admin-data-table admin-request-table">
        <caption className="visually-hidden">All RentEase rental requests</caption>
        <thead>
          <tr>
            <th scope="col">Property</th>
            <th scope="col">Tenant</th>
            <th scope="col">Owner</th>
            <th scope="col">Message</th>
            <th scope="col">Requested</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rentalRequests.map((rentalRequest) => (
            <tr key={rentalRequest.id}>
              <td>
                <strong>{rentalRequest.propertyTitle}</strong>
                <small>
                  {rentalRequest.propertyCity} ·{' '}
                  {propertyPriceFormatter.format(rentalRequest.propertyPrice)}
                </small>
              </td>
              <td>
                <strong>{rentalRequest.tenantName}</strong>
                <small>{rentalRequest.tenantEmail}</small>
              </td>
              <td>
                <strong>{rentalRequest.ownerName}</strong>
                <small>{rentalRequest.ownerEmail}</small>
              </td>
              <td>
                <p className="admin-request-message">
                  {rentalRequest.message || 'No message included.'}
                </p>
              </td>
              <td>
                <time dateTime={rentalRequest.createdAt}>
                  {formatPropertyDate(rentalRequest.createdAt)}
                </time>
              </td>
              <td>
                <AdminStatusBadge
                  label={
                    rentalRequest.status === 'approved'
                      ? 'Accepted'
                      : undefined
                  }
                  status={rentalRequest.status}
                />
              </td>
              <td>
                <AdminTableActions>
                  <DetailButton
                    label={`View rental request ${rentalRequest.id}`}
                    onClick={() => onViewDetails(rentalRequest)}
                  />
                </AdminTableActions>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
