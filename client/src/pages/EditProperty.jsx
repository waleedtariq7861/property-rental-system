import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  DashboardMobileNavigation,
  DashboardSidebar,
} from '../components/DashboardNavigation.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PropertyForm from '../components/PropertyForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getOwnerProperty,
  updateProperty,
} from '../services/propertyService.js';
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../utils/getApiErrorMessage.js';

function toFormValues(property, currentUser) {
  return {
    title: property.title || '',
    propertyType: property.propertyType || '',
    description: property.description || '',
    price: property.price === undefined ? '' : String(property.price),
    city: property.city || '',
    address: property.address || '',
    bedrooms: property.bedrooms === undefined ? '' : String(property.bedrooms),
    bathrooms:
      property.bathrooms === undefined ? '' : String(property.bathrooms),
    area: property.area === undefined ? '' : String(property.area),
    sizeUnit: property.sizeUnit || 'sq_ft',
    imageUrl: property.imageUrl || '',
    propertyStatus:
      property.propertyStatus || property.availabilityStatus || 'available',
    contactNumber: property.contactNumber || currentUser?.phone || '',
  };
}

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [property, setProperty] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadProperty() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await getOwnerProperty(id, {
          signal: controller.signal,
        });
        const nextProperty = result.data?.property;

        if (!nextProperty || typeof nextProperty !== 'object') {
          throw new TypeError('The property response is invalid.');
        }

        setProperty(nextProperty);
        setFormValues(toFormValues(nextProperty, currentUser));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setProperty(null);
        setFormValues(null);
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

    loadProperty();
    return () => controller.abort();
  }, [currentUser, id]);

  function handleFieldChange(fieldName) {
    setServerErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
    setErrorMessage('');
  }

  async function handleSubmit(payload) {
    setIsSubmitting(true);
    setServerErrors({});
    setErrorMessage('');

    try {
      const result = await updateProperty(id, payload);
      const updatedProperty = result.data?.property;

      if (!updatedProperty?.id) {
        throw new TypeError('The property update response is invalid.');
      }

      navigate('/owner/dashboard', {
        replace: true,
        state: {
          successMessage:
            `"${updatedProperty.title}" was updated successfully.`,
        },
      });
    } catch (error) {
      setServerErrors(getApiValidationErrors(error));
      setErrorMessage(
        error instanceof TypeError
          ? 'The property was updated, but its confirmation could not be loaded.'
          : getApiErrorMessage(error),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-shell owner-dashboard-page add-property-page">
      <div className="owner-dashboard-container">
        <DashboardMobileNavigation />

        <div className="owner-dashboard-layout">
          <DashboardSidebar owner={currentUser} />

          <main className="owner-dashboard-main">
            <header className="add-property-header edit-property-header">
              <div>
                <Link className="add-property-back-link" to="/owner/dashboard">
                  <i className="bi bi-arrow-left" aria-hidden="true" />
                  Back to dashboard
                </Link>
                <span className="owner-dashboard-eyebrow">
                  <i className="bi bi-pencil-square" aria-hidden="true" />
                  Manage listing
                </span>
                <h1>Edit Property</h1>
                <p>
                  Keep your listing details accurate so renters always see the
                  latest information.
                </p>
              </div>
              <div className="add-property-header-mark" aria-hidden="true">
                <i className="bi bi-pencil-square" />
              </div>
            </header>

            {errorMessage && !property && (
              <div className="owner-dashboard-state owner-dashboard-error-state" role="alert">
                <span className="owner-dashboard-state-icon" aria-hidden="true">
                  <i className="bi bi-exclamation-triangle" />
                </span>
                <h2>We could not open this property</h2>
                <p>{errorMessage}</p>
                <Link className="btn btn-brand" to="/owner/dashboard">
                  Return to dashboard
                </Link>
              </div>
            )}

            {isLoading && (
              <div className="owner-dashboard-state" aria-live="polite">
                <span className="owner-dashboard-state-icon" aria-hidden="true">
                  <i className="bi bi-house-gear" />
                </span>
                <LoadingSpinner label="Loading property details..." />
                <p>Preparing the listing for editing.</p>
              </div>
            )}

            {!isLoading && property && formValues && (
              <div className="add-property-layout">
                <div>
                  {errorMessage && (
                    <div className="alert alert-danger add-property-notification" role="alert">
                      <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                      <div>
                        <strong>Property could not be updated.</strong>
                        <span>{errorMessage}</span>
                      </div>
                    </div>
                  )}
                  <PropertyForm
                    currentUser={currentUser}
                    initialValues={formValues}
                    isSubmitting={isSubmitting}
                    onFieldChange={handleFieldChange}
                    onSubmit={handleSubmit}
                    serverErrors={serverErrors}
                    submitLabel="Save Changes"
                    submittingLabel="Saving changes..."
                  />
                </div>

                <aside className="add-property-guidance">
                  <span className="add-property-guidance-icon" aria-hidden="true">
                    <i className="bi bi-pencil-fill" />
                  </span>
                  <span className="section-label">Editing checklist</span>
                  <h2>Keep this listing current</h2>
                  <ul>
                    <li>
                      <i className="bi bi-check-circle-fill" aria-hidden="true" />
                      Confirm the price and availability status.
                    </li>
                    <li>
                      <i className="bi bi-check-circle-fill" aria-hidden="true" />
                      Keep the address and contact number accurate.
                    </li>
                    <li>
                      <i className="bi bi-check-circle-fill" aria-hidden="true" />
                      Update the image when the property changes.
                    </li>
                  </ul>
                  <p>Changes to an available listing appear in public results after saving.</p>
                </aside>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default EditProperty;
