import { useEffect, useState } from 'react';
import {
  PROPERTY_STATUS_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  validatePropertyForm,
} from '../utils/propertyFormValidation.js';

const EMPTY_VALUES = Object.freeze({
  title: '',
  propertyType: '',
  description: '',
  price: '',
  city: '',
  address: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  imageUrl: '',
  propertyStatus: 'available',
  contactNumber: '',
});

function FieldError({ error, id }) {
  if (!error) {
    return null;
  }

  return (
    <div className="field-error" id={id}>
      {error}
    </div>
  );
}

function PropertyForm({
  currentUser,
  isSubmitting,
  initialValues,
  serverErrors,
  onFieldChange,
  onSubmit,
  submitLabel = 'Add Property',
  submittingLabel = 'Saving property...',
}) {
  const [values, setValues] = useState({
    ...EMPTY_VALUES,
    ...initialValues,
    contactNumber: initialValues?.contactNumber || currentUser?.phone || '',
  });
  const [clientErrors, setClientErrors] = useState({});
  const errors = { ...serverErrors, ...clientErrors };

  useEffect(() => {
    setValues({
      ...EMPTY_VALUES,
      ...initialValues,
      contactNumber:
        initialValues?.contactNumber || currentUser?.phone || '',
    });
    setClientErrors({});
  }, [currentUser?.phone, initialValues]);

  function handleChange(event) {
    const { name, value } = event.target;

    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
    onFieldChange?.(name);
    setClientErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
  }

  function handleBlur(event) {
    const { name } = event.target;
    const result = validatePropertyForm(values);

    setClientErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      if (result.errors[name]) {
        nextErrors[name] = result.errors[name];
      } else {
        delete nextErrors[name];
      }

      return nextErrors;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const result = validatePropertyForm(values);

    if (Object.keys(result.errors).length > 0) {
      setClientErrors(result.errors);
      return;
    }

    setClientErrors({});
    await onSubmit(result.payload);
  }

  const inputState = (fieldName) =>
    errors[fieldName] ? ' is-invalid' : '';
  const describedBy = (fieldName, helpId) =>
    [errors[fieldName] ? `property-${fieldName}-error` : '', helpId]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <form className="add-property-form" noValidate onSubmit={handleSubmit}>
      <section
        className="add-property-form-section"
        aria-labelledby="listing-basics-heading"
      >
        <div className="add-property-section-heading">
          <span aria-hidden="true">
            <i className="bi bi-card-heading" />
          </span>
          <div>
            <h2 id="listing-basics-heading">Listing basics</h2>
            <p>Give renters a clear first impression of your property.</p>
          </div>
        </div>

        <div className="add-property-fields">
          <div className="add-property-field is-wide">
            <label className="form-label" htmlFor="property-title">
              Property Title
            </label>
            <input
              aria-describedby={describedBy('title')}
              aria-invalid={Boolean(errors.title)}
              className={`form-control${inputState('title')}`}
              disabled={isSubmitting}
              id="property-title"
              maxLength="180"
              name="title"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="e.g. Bright family home near F-10 Markaz"
              type="text"
              value={values.title}
            />
            <FieldError error={errors.title} id="property-title-error" />
          </div>

          <div className="add-property-field">
            <label className="form-label" htmlFor="property-type">
              Property Type
            </label>
            <select
              aria-describedby={describedBy('propertyType')}
              aria-invalid={Boolean(errors.propertyType)}
              className={`form-select${inputState('propertyType')}`}
              disabled={isSubmitting}
              id="property-type"
              name="propertyType"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.propertyType}
            >
              <option value="">Select a type</option>
              {PROPERTY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError
              error={errors.propertyType}
              id="property-propertyType-error"
            />
          </div>

          <div className="add-property-field">
            <label className="form-label" htmlFor="property-status">
              Property Status
            </label>
            <select
              aria-describedby={describedBy(
                'propertyStatus',
                'property-status-help',
              )}
              aria-invalid={Boolean(errors.propertyStatus)}
              className={`form-select${inputState('propertyStatus')}`}
              disabled={isSubmitting}
              id="property-status"
              name="propertyStatus"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.propertyStatus}
            >
              {PROPERTY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="form-text" id="property-status-help">
              Available listings are published to the public property feed.
            </div>
            <FieldError
              error={errors.propertyStatus}
              id="property-propertyStatus-error"
            />
          </div>

          <div className="add-property-field is-wide">
            <label className="form-label" htmlFor="property-description">
              Description
            </label>
            <textarea
              aria-describedby={describedBy('description')}
              aria-invalid={Boolean(errors.description)}
              className={`form-control${inputState('description')}`}
              disabled={isSubmitting}
              id="property-description"
              maxLength="10000"
              name="description"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="Describe the layout, condition, nearby amenities, and standout features."
              rows="6"
              value={values.description}
            />
            <FieldError
              error={errors.description}
              id="property-description-error"
            />
          </div>
        </div>
      </section>

      <section
        className="add-property-form-section"
        aria-labelledby="location-pricing-heading"
      >
        <div className="add-property-section-heading">
          <span aria-hidden="true">
            <i className="bi bi-geo-alt-fill" />
          </span>
          <div>
            <h2 id="location-pricing-heading">Location and pricing</h2>
            <p>Add the rent and exact location renters need to evaluate it.</p>
          </div>
        </div>

        <div className="add-property-fields">
          <div className="add-property-field">
            <label className="form-label" htmlFor="property-price">
              Monthly Price
            </label>
            <div className="add-property-input-prefix">
              <span>PKR</span>
              <input
                aria-describedby={describedBy('price')}
                aria-invalid={Boolean(errors.price)}
                className={`form-control${inputState('price')}`}
                disabled={isSubmitting}
                id="property-price"
                inputMode="decimal"
                min="0.01"
                name="price"
                onBlur={handleBlur}
                onChange={handleChange}
                placeholder="85000"
                step="0.01"
                type="number"
                value={values.price}
              />
            </div>
            <FieldError error={errors.price} id="property-price-error" />
          </div>

          <div className="add-property-field">
            <label className="form-label" htmlFor="property-city">
              City
            </label>
            <input
              aria-describedby={describedBy('city')}
              aria-invalid={Boolean(errors.city)}
              className={`form-control${inputState('city')}`}
              disabled={isSubmitting}
              id="property-city"
              maxLength="100"
              name="city"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="Islamabad"
              type="text"
              value={values.city}
            />
            <FieldError error={errors.city} id="property-city-error" />
          </div>

          <div className="add-property-field is-wide">
            <label className="form-label" htmlFor="property-address">
              Full Address
            </label>
            <input
              aria-describedby={describedBy('address')}
              aria-invalid={Boolean(errors.address)}
              className={`form-control${inputState('address')}`}
              disabled={isSubmitting}
              id="property-address"
              maxLength="255"
              name="address"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="House 12, Street 8, F-10/2, Islamabad"
              type="text"
              value={values.address}
            />
            <FieldError error={errors.address} id="property-address-error" />
          </div>
        </div>
      </section>

      <section
        className="add-property-form-section"
        aria-labelledby="property-details-heading"
      >
        <div className="add-property-section-heading">
          <span aria-hidden="true">
            <i className="bi bi-rulers" />
          </span>
          <div>
            <h2 id="property-details-heading">Property details</h2>
            <p>Help renters understand the size and room configuration.</p>
          </div>
        </div>

        <div className="add-property-fields is-three-column">
          <div className="add-property-field">
            <label className="form-label" htmlFor="property-bedrooms">
              Bedrooms
            </label>
            <input
              aria-describedby={describedBy('bedrooms')}
              aria-invalid={Boolean(errors.bedrooms)}
              className={`form-control${inputState('bedrooms')}`}
              disabled={isSubmitting}
              id="property-bedrooms"
              inputMode="numeric"
              min="1"
              name="bedrooms"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="3"
              step="1"
              type="number"
              value={values.bedrooms}
            />
            <FieldError error={errors.bedrooms} id="property-bedrooms-error" />
          </div>

          <div className="add-property-field">
            <label className="form-label" htmlFor="property-bathrooms">
              Bathrooms
            </label>
            <input
              aria-describedby={describedBy('bathrooms')}
              aria-invalid={Boolean(errors.bathrooms)}
              className={`form-control${inputState('bathrooms')}`}
              disabled={isSubmitting}
              id="property-bathrooms"
              inputMode="decimal"
              min="0.1"
              name="bathrooms"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="2"
              step="0.1"
              type="number"
              value={values.bathrooms}
            />
            <FieldError
              error={errors.bathrooms}
              id="property-bathrooms-error"
            />
          </div>

          <div className="add-property-field">
            <label className="form-label" htmlFor="property-area">
              Area (Sq. Ft.)
            </label>
            <input
              aria-describedby={describedBy('area')}
              aria-invalid={Boolean(errors.area)}
              className={`form-control${inputState('area')}`}
              disabled={isSubmitting}
              id="property-area"
              inputMode="decimal"
              min="0.01"
              name="area"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="1250"
              step="0.01"
              type="number"
              value={values.area}
            />
            <FieldError error={errors.area} id="property-area-error" />
          </div>
        </div>
      </section>

      <section
        className="add-property-form-section"
        aria-labelledby="media-contact-heading"
      >
        <div className="add-property-section-heading">
          <span aria-hidden="true">
            <i className="bi bi-image-fill" />
          </span>
          <div>
            <h2 id="media-contact-heading">Media and contact</h2>
            <p>Provide a strong cover image and a reliable renter contact.</p>
          </div>
        </div>

        <div className="add-property-fields">
          <div className="add-property-field is-wide">
            <label className="form-label" htmlFor="property-image-url">
              Image URL
            </label>
            <input
              aria-describedby={describedBy(
                'imageUrl',
                'property-image-url-help',
              )}
              aria-invalid={Boolean(errors.imageUrl)}
              className={`form-control${inputState('imageUrl')}`}
              disabled={isSubmitting}
              id="property-image-url"
              maxLength="500"
              name="imageUrl"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="https://example.com/property-image.jpg"
              type="url"
              value={values.imageUrl}
            />
            <div className="form-text" id="property-image-url-help">
              Use a direct, publicly accessible HTTP or HTTPS image URL.
            </div>
            <FieldError
              error={errors.imageUrl}
              id="property-imageUrl-error"
            />
          </div>

          <div className="add-property-field is-wide">
            <label className="form-label" htmlFor="property-contact-number">
              Contact Number
            </label>
            <input
              aria-describedby={describedBy(
                'contactNumber',
                'property-contact-number-help',
              )}
              aria-invalid={Boolean(errors.contactNumber)}
              autoComplete="tel"
              className={`form-control${inputState('contactNumber')}`}
              disabled={isSubmitting}
              id="property-contact-number"
              inputMode="tel"
              maxLength="25"
              name="contactNumber"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="+92 300 1234567"
              type="tel"
              value={values.contactNumber}
            />
            <div className="form-text" id="property-contact-number-help">
              Renters will use this number to contact you about this listing.
            </div>
            <FieldError
              error={errors.contactNumber}
              id="property-contactNumber-error"
            />
          </div>
        </div>
      </section>

      <div className="add-property-submit-bar">
        <div>
          <i className="bi bi-shield-check" aria-hidden="true" />
          <span>Your owner account is verified before every submission.</span>
        </div>
        <button
          className="btn btn-brand add-property-submit-button"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <span
                aria-hidden="true"
                className="spinner-border spinner-border-sm"
              />
              {submittingLabel}
            </>
          ) : (
            <>
              <i className="bi bi-plus-circle-fill" aria-hidden="true" />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default PropertyForm;
