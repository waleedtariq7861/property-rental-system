import { useState } from 'react';
import apartmentImage from '../assets/images/property-apartment-islamabad.png';
import houseImage from '../assets/images/property-house-interior.png';
import officeImage from '../assets/images/property-office-pakistan.png';
import studioImage from '../assets/images/property-room-studio.png';
import defaultPropertyImage from '../assets/images/property-shop-exterior.png';

const fallbackImages = Object.freeze({
  apartment: apartmentImage,
  house: houseImage,
  villa: houseImage,
  office: officeImage,
  studio: studioImage,
});

const priceFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
});

function formatPropertyType(propertyType) {
  return propertyType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatCount(value, singular, plural) {
  return `${value} ${Number(value) === 1 ? singular : plural}`;
}

function PropertyCard({ property }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const propertyType = formatPropertyType(property.propertyType);
  const fallbackImage =
    fallbackImages[property.propertyType] || defaultPropertyImage;
  const detailsId = `property-details-${property.id}`;

  function handleImageError(event) {
    if (event.currentTarget.dataset.fallbackApplied === 'true') {
      return;
    }

    event.currentTarget.dataset.fallbackApplied = 'true';
    event.currentTarget.src = fallbackImage;
  }

  return (
    <article className="property-listing-card h-100">
      <div className="property-listing-image-wrap">
        <img
          className="property-listing-image"
          src={property.imageUrl || fallbackImage}
          alt={`${property.title} in ${property.city}`}
          onError={handleImageError}
        />
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
            {priceFormatter.format(property.price)}
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
            {formatCount(property.bedrooms, 'Bedroom', 'Bedrooms')}
          </span>
          <span>
            <i className="bi bi-droplet-half" aria-hidden="true" />
            {formatCount(property.bathrooms, 'Bathroom', 'Bathrooms')}
          </span>
        </div>

        <div
          className={`property-listing-details${isExpanded ? ' is-visible' : ''}`}
          id={detailsId}
          hidden={!isExpanded}
        >
          <p className="mb-0">{property.description}</p>
        </div>

        <button
          className="btn btn-outline-brand property-details-button w-100"
          type="button"
          aria-controls={detailsId}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
        >
          {isExpanded ? 'Hide Details' : 'View Details'}
          <i
            className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-arrow-up-right'}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </article>
  );
}

export default PropertyCard;
