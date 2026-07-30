import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DashboardMobileNavigation,
  DashboardSidebar,
} from '../components/DashboardNavigation.jsx';
import PropertyForm from '../components/PropertyForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createProperty } from '../services/propertyService.js';
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../utils/getApiErrorMessage.js';

function AddProperty() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

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
      const result = await createProperty(payload);
      const property = result.data?.property;

      if (!property?.id) {
        throw new TypeError('The property creation response is invalid.');
      }

      navigate('/owner/dashboard', {
        replace: true,
        state: {
          successMessage:
            `"${property.title}" was added successfully and is now in your portfolio.`,
        },
      });
    } catch (error) {
      const validationErrors = getApiValidationErrors(error);

      setServerErrors(validationErrors);
      setErrorMessage(
        error instanceof TypeError
          ? 'The property was saved, but its confirmation could not be loaded.'
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
            <header className="add-property-header">
              <div>
                <Link className="add-property-back-link" to="/owner/dashboard">
                  <i className="bi bi-arrow-left" aria-hidden="true" />
                  Back to dashboard
                </Link>
                <span className="owner-dashboard-eyebrow">
                  <i className="bi bi-house-add-fill" aria-hidden="true" />
                  New listing
                </span>
                <h1>Add a Property</h1>
                <p>
                  Create a polished rental listing and publish it to your
                  RentEase portfolio.
                </p>
              </div>
              <div className="add-property-header-mark" aria-hidden="true">
                <i className="bi bi-house-add-fill" />
              </div>
            </header>

            {errorMessage && (
              <div
                className="alert alert-danger add-property-notification"
                role="alert"
              >
                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                <div>
                  <strong>Property could not be added.</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <div className="add-property-layout">
              <PropertyForm
                currentUser={currentUser}
                isSubmitting={isSubmitting}
                onFieldChange={handleFieldChange}
                onSubmit={handleSubmit}
                serverErrors={serverErrors}
              />

              <aside className="add-property-guidance">
                <span className="add-property-guidance-icon" aria-hidden="true">
                  <i className="bi bi-lightbulb-fill" />
                </span>
                <span className="section-label">Listing checklist</span>
                <h2>Make your property stand out</h2>
                <ul>
                  <li>
                    <i className="bi bi-check-circle-fill" aria-hidden="true" />
                    Use a specific, easy-to-scan title.
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill" aria-hidden="true" />
                    Describe nearby landmarks and amenities.
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill" aria-hidden="true" />
                    Add a bright, landscape-oriented image.
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill" aria-hidden="true" />
                    Double-check your contact number.
                  </li>
                </ul>
                <p>
                  Available properties appear in public listings immediately.
                  Rented properties remain visible only in your owner portfolio.
                </p>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AddProperty;
