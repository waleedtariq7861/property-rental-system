import { useEffect, useRef } from 'react';
import {
  formatPropertyDate,
  formatPropertySizeUnit,
  formatPropertyType,
  propertyPriceFormatter,
} from '../utils/propertyFormatting.js';
import AdminStatusBadge from './AdminStatusBadge.jsx';

function DetailItem({ children, fullWidth = false, label }) {
  return (
    <div className={fullWidth ? 'admin-detail-item is-wide' : 'admin-detail-item'}>
      <dt>{label}</dt>
      <dd>{children ?? 'Not provided'}</dd>
    </div>
  );
}

function UserDetails({ user }) {
  return (
    <dl className="admin-detail-grid">
      <DetailItem label="User ID">#{user.id}</DetailItem>
      <DetailItem label="Full name">{user.fullName}</DetailItem>
      <DetailItem label="Email">{user.email}</DetailItem>
      <DetailItem label="Phone">{user.phone || 'Not provided'}</DetailItem>
      <DetailItem label="Role"><AdminStatusBadge status={user.role} /></DetailItem>
      <DetailItem label="Account status">
        <AdminStatusBadge status={user.accountStatus} />
      </DetailItem>
      <DetailItem label="Owned properties">{Number(user.propertyCount || 0)}</DetailItem>
      <DetailItem label="Rental records">
        {Number(user.rentalRequestCount || 0)}
      </DetailItem>
      <DetailItem label="Joined">{formatPropertyDate(user.createdAt)}</DetailItem>
      <DetailItem label="Last updated">
        {formatPropertyDate(user.updatedAt)}
      </DetailItem>
    </dl>
  );
}

function PropertyDetails({ property }) {
  const size = property.propertySize
    ? `${property.propertySize} ${formatPropertySizeUnit(property.sizeUnit)}`
    : 'Not provided';

  return (
    <dl className="admin-detail-grid">
      <DetailItem label="Property ID">#{property.id}</DetailItem>
      <DetailItem label="Title">{property.title}</DetailItem>
      <DetailItem label="Owner">{property.ownerName}</DetailItem>
      <DetailItem label="Owner email">{property.ownerEmail}</DetailItem>
      <DetailItem fullWidth label="Description">{property.description}</DetailItem>
      <DetailItem label="Type">{formatPropertyType(property.propertyType)}</DetailItem>
      <DetailItem label="Category">
        {formatPropertyType(property.propertyCategory)}
      </DetailItem>
      <DetailItem label="Monthly rent">
        {propertyPriceFormatter.format(property.price)}
      </DetailItem>
      <DetailItem label="Security deposit">
        {propertyPriceFormatter.format(property.securityDeposit)}
      </DetailItem>
      <DetailItem label="City and area">
        {property.city} · {property.area}
      </DetailItem>
      <DetailItem label="Contact">{property.contactNumber || 'Not provided'}</DetailItem>
      <DetailItem fullWidth label="Address">{property.address}</DetailItem>
      <DetailItem label="Bedrooms">{property.bedrooms}</DetailItem>
      <DetailItem label="Bathrooms">{property.bathrooms}</DetailItem>
      <DetailItem label="Property size">{size}</DetailItem>
      <DetailItem label="Furnishing">
        {formatPropertyType(property.furnishedStatus)}
      </DetailItem>
      <DetailItem label="Parking">
        {Number(property.parkingAvailable) ? 'Available' : 'Not available'}
      </DetailItem>
      <DetailItem label="Rental requests">
        {Number(property.rentalRequestCount || 0)}
      </DetailItem>
      <DetailItem label="Listing status">
        <span className="admin-detail-statuses">
          <AdminStatusBadge status={property.availabilityStatus} />
          <AdminStatusBadge status={property.approvalStatus} />
        </span>
      </DetailItem>
      <DetailItem label="Added">{formatPropertyDate(property.createdAt)}</DetailItem>
      <DetailItem label="Last updated">
        {formatPropertyDate(property.updatedAt)}
      </DetailItem>
      <DetailItem fullWidth label="Image URL">
        {property.imageUrl ? (
          <a href={property.imageUrl} rel="noreferrer" target="_blank">
            Open listing image
          </a>
        ) : (
          'Not provided'
        )}
      </DetailItem>
    </dl>
  );
}

function RentalRequestDetails({ rentalRequest }) {
  return (
    <dl className="admin-detail-grid">
      <DetailItem label="Request ID">#{rentalRequest.id}</DetailItem>
      <DetailItem label="Status">
        <AdminStatusBadge
          label={rentalRequest.status === 'approved' ? 'Accepted' : undefined}
          status={rentalRequest.status}
        />
      </DetailItem>
      <DetailItem label="Property">
        #{rentalRequest.propertyId} · {rentalRequest.propertyTitle}
      </DetailItem>
      <DetailItem label="Property type">
        {formatPropertyType(rentalRequest.propertyType)}
      </DetailItem>
      <DetailItem label="Location">{rentalRequest.propertyCity}</DetailItem>
      <DetailItem label="Monthly rent">
        {propertyPriceFormatter.format(rentalRequest.propertyPrice)}
      </DetailItem>
      <DetailItem label="Tenant">
        #{rentalRequest.tenantId} · {rentalRequest.tenantName}
      </DetailItem>
      <DetailItem label="Tenant email">{rentalRequest.tenantEmail}</DetailItem>
      <DetailItem label="Owner">
        #{rentalRequest.ownerId} · {rentalRequest.ownerName}
      </DetailItem>
      <DetailItem label="Owner email">{rentalRequest.ownerEmail}</DetailItem>
      <DetailItem fullWidth label="Tenant message">
        {rentalRequest.message || 'No message included.'}
      </DetailItem>
      <DetailItem label="Requested">
        {formatPropertyDate(rentalRequest.createdAt)}
      </DetailItem>
      <DetailItem label="Last updated">
        {formatPropertyDate(rentalRequest.updatedAt)}
      </DetailItem>
    </dl>
  );
}

const TITLES = {
  user: 'User details',
  property: 'Property details',
  rentalRequest: 'Rental request details',
};

function AdminDetailsModal({ onClose, record, resourceType }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <section
        aria-labelledby="admin-details-title"
        aria-modal="true"
        className="admin-details-modal"
        role="dialog"
      >
        <header>
          <div>
            <span>Complete record</span>
            <h2 id="admin-details-title">{TITLES[resourceType]}</h2>
          </div>
          <button
            aria-label="Close details"
            className="admin-modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </header>

        {resourceType === 'user' && <UserDetails user={record} />}
        {resourceType === 'property' && <PropertyDetails property={record} />}
        {resourceType === 'rentalRequest' && (
          <RentalRequestDetails rentalRequest={record} />
        )}
      </section>
    </div>
  );
}

export default AdminDetailsModal;
