import {
  formatPropertyDate,
  formatPropertyType,
  propertyPriceFormatter,
} from '../utils/propertyFormatting.js';
import PropertyImage from './PropertyImage.jsx';

const STATUS_PRESENTATION = Object.freeze({
  active: {
    label: 'Active',
    icon: 'bi-check-circle-fill',
  },
  pending: {
    label: 'Pending Review',
    icon: 'bi-hourglass-split',
  },
  rejected: {
    label: 'Rejected',
    icon: 'bi-x-circle-fill',
  },
  rented: {
    label: 'Rented',
    icon: 'bi-key-fill',
  },
  unavailable: {
    label: 'Unavailable',
    icon: 'bi-pause-circle-fill',
  },
});

function getCurrentStatus(property) {
  if (property.currentStatus) {
    return property.currentStatus;
  }

  if (property.approvalStatus !== 'approved') {
    return property.approvalStatus;
  }

  return property.availabilityStatus === 'available'
    ? 'active'
    : property.availabilityStatus;
}

function OwnerPropertyCard({ property }) {
  const currentStatus = getCurrentStatus(property);
  const status = STATUS_PRESENTATION[currentStatus] || {
    label: 'Status unavailable',
    icon: 'bi-question-circle-fill',
  };

  return (
    <article className="owner-property-card">
      <div className="owner-property-image-wrap">
        <PropertyImage className="owner-property-image" property={property} />
        <span className={`owner-property-status is-${currentStatus}`}>
          <i className={`bi ${status.icon}`} aria-hidden="true" />
          {status.label}
        </span>
      </div>

      <div className="owner-property-body">
        <p className="owner-property-location">
          <i className="bi bi-geo-alt-fill" aria-hidden="true" />
          {property.city}
        </p>
        <h3>{property.title}</h3>
        <p className="owner-property-price">
          {propertyPriceFormatter.format(property.price)}
          <span>/ month</span>
        </p>

        <dl className="owner-property-details">
          <div>
            <dt>Property type</dt>
            <dd>{formatPropertyType(property.propertyType)}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatPropertyDate(property.createdAt)}</dd>
          </div>
          <div>
            <dt>Current status</dt>
            <dd>{status.label}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default OwnerPropertyCard;
