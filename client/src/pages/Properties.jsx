import { useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PropertyCard from '../components/PropertyCard.jsx';
import { getProperties } from '../services/propertyService.js';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js';

function Properties() {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProperties() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await getProperties({ signal: controller.signal });
        const nextProperties = result.data?.properties;

        if (!Array.isArray(nextProperties)) {
          throw new TypeError('The property response is not in the expected format.');
        }

        setProperties(nextProperties);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setProperties([]);
        setErrorMessage(
          error instanceof TypeError
            ? 'Property data could not be loaded. Please try again shortly.'
            : getApiErrorMessage(error),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProperties();

    return () => controller.abort();
  }, [requestKey]);

  return (
    <div className="page-shell properties-page">
      <section className="properties-heading-section">
        <div className="container">
          <div className="properties-heading-content">
            <div>
              <span className="section-label">Available rentals</span>
              <h1 className="display-5 fw-bold mt-2 mb-3">
                Find a place that feels right
              </h1>
              <p className="section-intro mb-0">
                Explore verified rental opportunities across Pakistan, with the
                essential details you need to compare your options confidently.
              </p>
            </div>

            {!isLoading && !errorMessage && properties.length > 0 && (
              <div className="property-result-count" aria-live="polite">
                <strong>{properties.length}</strong>
                <span>{properties.length === 1 ? 'property' : 'properties'} available</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="properties-grid-section">
        <div className="container">
          {isLoading && (
            <div className="property-state-card" aria-live="polite">
              <LoadingSpinner label="Loading properties..." />
              <p className="mb-0">Finding the latest available rentals for you.</p>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="property-state-card property-error-state" role="alert">
              <span className="property-state-icon" aria-hidden="true">
                <i className="bi bi-exclamation-triangle" />
              </span>
              <h2 className="h4">We could not load the properties</h2>
              <p>{errorMessage}</p>
              <button
                className="btn btn-brand"
                type="button"
                onClick={() => setRequestKey((currentKey) => currentKey + 1)}
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !errorMessage && properties.length === 0 && (
            <div className="property-state-card">
              <span className="property-state-icon" aria-hidden="true">
                <i className="bi bi-house-heart" />
              </span>
              <h2 className="h4">No properties are available right now</h2>
              <p className="mb-0">
                New listings are added regularly. Please check back again soon.
              </p>
            </div>
          )}

          {!isLoading && !errorMessage && properties.length > 0 && (
            <div className="row g-4">
              {properties.map((property) => (
                <div className="col-md-6 col-xl-4" key={property.id}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Properties;
