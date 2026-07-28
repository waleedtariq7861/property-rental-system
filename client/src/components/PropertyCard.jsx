import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  formatPropertyCount,
  formatPropertyType,
  propertyPriceFormatter,
} from '../utils/propertyFormatting.js';
import PropertyImage from './PropertyImage.jsx';

function PropertyCard({ property }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const propertyType = formatPropertyType(property.propertyType);
  const detailsId = `property-details-${property.id}`;

  return (
    <article className="property-listing-card h-100">
      <div className="property-listing-image-wrap">
        <Link
          className="property-listing-image-link"
          to={`/properties/${property.id}`}
          aria-label={`Open ${property.title}`}
        >
          <PropertyImage className="property-listing-image" property={property} />
        </Link>
        <span className="property-type-badge">{propertyType}</span>
      </div>

      <div className="property-listing-body">
        <div className="property-listing-heading">
          <div>
            <p className="property-listing-city mb-2">
              <i className="bi bi-geo-alt-fill" aria-hidden="true" />
              {property.city}
            </p>
            <h2 className="h5 mb-0">{property.title}</h2>
          </div>
          <p className="property-listing-price mb-0">
            {propertyPriceFormatter.format(property.price)}
            <span>/ month</span>
          </p>
        </div>

        <p className="property-listing-address">
          <i className="bi bi-signpost-2" aria-hidden="true" />
          {property.address}
        </p>

        <div className="property-listing-meta">
          <span>
            <i className="bi bi-door-open" aria-hidden="true" />
            {formatPropertyCount(property.bedrooms, 'Bedroom', 'Bedrooms')}
          </span>
          <span>
            <i className="bi bi-droplet-half" aria-hidden="true" />
            {formatPropertyCount(property.bathrooms, 'Bathroom', 'Bathrooms')}
          </span>
        </div>

        <div
          className={`property-listing-details${isExpanded ? ' is-visible' : ''}`}
          id={detailsId}
          hidden={!isExpanded}
        >
          <p className="mb-0">{property.description}</p>
        </div>

        <div className="property-card-actions">
          <button
            className="btn btn-outline-brand property-details-button"
            type="button"
            aria-controls={detailsId}
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((currentValue) => !currentValue)}
          >
            {isExpanded ? 'Hide Details' : 'View Details'}
            <i
              className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}
              aria-hidden="true"
            />
          </button>
          <Link
            className="btn btn-brand property-details-link"
            to={`/properties/${property.id}`}
          >
            Full details
            <i className="bi bi-arrow-up-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
