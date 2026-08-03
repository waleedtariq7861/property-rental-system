import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PropertyImage from '../components/PropertyImage.jsx';
import RentalRequestPanel from '../components/RentalRequestPanel.jsx';
import { getPropertyById } from '../services/propertyService.js';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js';
import {
  formatPropertyArea,
  formatPropertyCount,
  formatPropertyDate,
  formatPropertyType,
  propertyPriceFormatter,
} from '../utils/propertyFormatting.js';

function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProperty() {
      setIsLoading(true);
      setIsNotFound(false);
      setErrorMessage('');

      try {
        const result = await getPropertyById(id, {
          signal: controller.signal,
        });
        const nextProperty = result.data?.property;

        if (!nextProperty || typeof nextProperty !== 'object') {
          throw new TypeError('The property response is not in the expected format.');
        }

        setProperty(nextProperty);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setProperty(null);

        if (error.response?.status === 404) {
          setIsNotFound(true);
        } else {
          setErrorMessage(
            error instanceof TypeError
              ? 'Property details could not be loaded. Please try again shortly.'
              : getApiErrorMessage(error),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProperty();

    return () => controller.abort();
  }, [id, requestKey]);

  if (isLoading) {
    return (
      <section className="property-detail-state-section">
        <div className="property-state-card" aria-live="polite">
          <LoadingSpinner label="Loading property details..." />
          <p className="mb-0">Preparing the complete listing for you.</p>
        </div>
      </section>
    );
  }

  if (isNotFound) {
    return (
      <section className="section-space not-found-section">
        <div className="container text-center">
          <span className="not-found-code">404</span>
          <h1 className="display-5 fw-bold">Property not found.</h1>
          <p className="section-intro mx-auto mb-4">
            This property may no longer be available, or the listing address may
            be incorrect.
          </p>
          <Link className="btn btn-brand btn-lg" to="/properties">
            <i className="bi bi-arrow-left me-2" aria-hidden="true" />
            Browse properties
          </Link>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="property-detail-state-section">
        <div className="property-state-card property-error-state" role="alert">
          <span className="property-state-icon" aria-hidden="true">
            <i className="bi bi-exclamation-triangle" />
          </span>
          <h1 className="h4">We could not load this property</h1>
          <p>{errorMessage}</p>
          <button
            className="btn btn-brand"
            type="button"
            onClick={() => setRequestKey((currentKey) => currentKey + 1)}
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="page-shell property-detail-page">
      <section className="property-detail-hero">
        <div className="container">
          <Link className="property-back-link" to="/properties">
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Back to properties
          </Link>

          <div className="property-detail-title-row">
            <div>
              <div className="property-detail-badges">
                <span>{formatPropertyType(property.propertyType)}</span>
                <span>
                  <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                  {property.city}
                </span>
              </div>
              <h1>{property.title}</h1>
              <p className="property-detail-address">
                <i className="bi bi-signpost-2" aria-hidden="true" />
                {property.address}
              </p>
            </div>

            <div className="property-detail-price">
              <span>Monthly rent</span>
              <strong>{propertyPriceFormatter.format(property.price)}</strong>
              <small>per month</small>
            </div>
          </div>
        </div>
      </section>

      <section className="property-detail-content">
        <div className="container">
          <div className="property-detail-image-wrap">
            <PropertyImage
              className="property-detail-image"
              property={property}
            />
          </div>

          <div className="property-detail-layout">
            <div className="property-detail-main">
              <div className="property-detail-facts">
                <div>
                  <i className="bi bi-door-open" aria-hidden="true" />
                  <span>Bedrooms</span>
                  <strong>
                    {formatPropertyCount(
                      property.bedrooms,
                      'Bedroom',
                      'Bedrooms',
                    )}
                  </strong>
                </div>
                <div>
                  <i className="bi bi-droplet-half" aria-hidden="true" />
                  <span>Bathrooms</span>
                  <strong>
                    {formatPropertyCount(
                      property.bathrooms,
                      'Bathroom',
                      'Bathrooms',
                    )}
                  </strong>
                </div>
                <div>
                  <i className="bi bi-building" aria-hidden="true" />
                  <span>Property type</span>
                  <strong>{formatPropertyType(property.propertyType)}</strong>
                </div>
                {property.area && (
                  <div>
                    <i className="bi bi-rulers" aria-hidden="true" />
                    <span>Area</span>
                    <strong>
                      {formatPropertyArea(property.area, property.sizeUnit)}
                    </strong>
                  </div>
                )}
              </div>

              <article className="property-description-card">
                <span className="property-control-kicker">About this property</span>
                <h2 className="h3">A closer look</h2>
                <p>{property.description}</p>
              </article>
            </div>

            <aside className="property-listing-summary">
              <span className="property-control-kicker">Listing information</span>
              <h2 className="h4">Property overview</h2>
              <dl>
                <div>
                  <dt>City</dt>
                  <dd>{property.city}</dd>
                </div>
                <div>
                  <dt>Full address</dt>
                  <dd>{property.address}</dd>
                </div>
                {property.ownerName && (
                  <div>
                    <dt>Owner</dt>
                    <dd>{property.ownerName}</dd>
                  </div>
                )}
                {property.contactNumber && (
                  <div>
                    <dt>Contact number</dt>
                    <dd>
                      <a href={`tel:${property.contactNumber}`}>
                        {property.contactNumber}
                      </a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Listed on</dt>
                  <dd>{formatPropertyDate(property.createdAt)}</dd>
                </div>
              </dl>
              <RentalRequestPanel key={property.id} property={property} />
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PropertyDetails;
