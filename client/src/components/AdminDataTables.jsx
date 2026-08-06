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

export function AdminUsersTable({ users }) {
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
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminPropertiesTable({ properties }) {
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
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminRentalRequestsTable({ rentalRequests }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
