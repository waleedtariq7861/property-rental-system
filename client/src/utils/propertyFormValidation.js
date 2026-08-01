export const PROPERTY_TYPE_OPTIONS = Object.freeze([
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'office', label: 'Office' },
  { value: 'studio', label: 'Studio' },
  { value: 'portion', label: 'Portion' },
  { value: 'room', label: 'Room' },
  { value: 'shop', label: 'Shop' },
]);

export const PROPERTY_STATUS_OPTIONS = Object.freeze([
  { value: 'available', label: 'Available' },
  { value: 'rented', label: 'Rented' },
]);

const PROPERTY_TYPES = new Set(
  PROPERTY_TYPE_OPTIONS.map((option) => option.value),
);
const PROPERTY_STATUSES = new Set(
  PROPERTY_STATUS_OPTIONS.map((option) => option.value),
);
const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;
const POSITIVE_DECIMAL_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const ONE_DECIMAL_PATTERN = /^\d+(?:\.\d)?$/;
const CONTACT_NUMBER_PATTERN = /^\+?[\d\s()-]+$/;

function normalizeText(value) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ')
    : '';
}

function validateRequiredText({
  value,
  field,
  label,
  maxLength,
  errors,
}) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    errors[field] = `${label} is required.`;
  } else if (normalizedValue.length > maxLength) {
    errors[field] = `${label} must not exceed ${maxLength} characters.`;
  }

  return normalizedValue;
}

function validatePositiveDecimal({
  value,
  field,
  label,
  maximum,
  allowZero = false,
  decimalPlaces = 2,
  errors,
}) {
  const normalizedValue = normalizeText(value);
  const numberValue = Number(normalizedValue);
  const decimalPattern = decimalPlaces === 1
    ? ONE_DECIMAL_PATTERN
    : POSITIVE_DECIMAL_PATTERN;
  const precisionLabel = decimalPlaces === 1
    ? 'one decimal place'
    : 'two decimal places';

  if (!normalizedValue) {
    errors[field] = `${label} is required.`;
  } else if (
    !decimalPattern.test(normalizedValue) ||
    !Number.isFinite(numberValue) ||
    (allowZero ? numberValue < 0 : numberValue <= 0)
  ) {
    errors[field] =
      `${label} must be a ${allowZero ? 'non-negative' : 'positive'} number with up to ${precisionLabel}.`;
  } else if (numberValue > maximum) {
    errors[field] = `${label} must not exceed ${maximum}.`;
  }

  return normalizedValue;
}

export function validatePropertyForm(values) {
  const errors = {};
  const title = validateRequiredText({
    value: values.title,
    field: 'title',
    label: 'Property title',
    maxLength: 180,
    errors,
  });
  const propertyType = normalizeText(values.propertyType).toLowerCase();
  const description = validateRequiredText({
    value: values.description,
    field: 'description',
    label: 'Description',
    maxLength: 10_000,
    errors,
  });
  const price = validatePositiveDecimal({
    value: values.price,
    field: 'price',
    label: 'Price',
    maximum: 9_999_999_999.99,
    errors,
  });
  const city = validateRequiredText({
    value: values.city,
    field: 'city',
    label: 'City',
    maxLength: 100,
    errors,
  });
  const address = validateRequiredText({
    value: values.address,
    field: 'address',
    label: 'Full address',
    maxLength: 255,
    errors,
  });
  const bedrooms = normalizeText(values.bedrooms);
  const bathrooms = validatePositiveDecimal({
    value: values.bathrooms,
    field: 'bathrooms',
    label: 'Bathrooms',
    maximum: 99.9,
    allowZero: true,
    decimalPlaces: 1,
    errors,
  });
  const area = validatePositiveDecimal({
    value: values.area,
    field: 'area',
    label: 'Area',
    maximum: 99_999_999.99,
    errors,
  });
  const imageUrl = validateRequiredText({
    value: values.imageUrl,
    field: 'imageUrl',
    label: 'Image URL',
    maxLength: 500,
    errors,
  });
  const propertyStatus = normalizeText(values.propertyStatus).toLowerCase();
  const contactNumber = validateRequiredText({
    value: values.contactNumber,
    field: 'contactNumber',
    label: 'Contact number',
    maxLength: 25,
    errors,
  });

  if (!propertyType) {
    errors.propertyType = 'Property type is required.';
  } else if (!PROPERTY_TYPES.has(propertyType)) {
    errors.propertyType = 'Select a valid property type.';
  }

  if (!bedrooms) {
    errors.bedrooms = 'Bedrooms is required.';
  } else if (
    !NON_NEGATIVE_INTEGER_PATTERN.test(bedrooms) ||
    Number(bedrooms) > 65_535
  ) {
    errors.bedrooms =
      'Bedrooms must be a non-negative integer no greater than 65535.';
  }

  if (imageUrl && !errors.imageUrl) {
    try {
      const parsedUrl = new URL(imageUrl);

      if (
        !['http:', 'https:'].includes(parsedUrl.protocol) ||
        parsedUrl.username ||
        parsedUrl.password
      ) {
        throw new TypeError('Unsupported URL.');
      }
    } catch {
      errors.imageUrl = 'Enter a valid HTTP or HTTPS image URL.';
    }
  }

  if (!propertyStatus) {
    errors.propertyStatus = 'Property status is required.';
  } else if (!PROPERTY_STATUSES.has(propertyStatus)) {
    errors.propertyStatus = 'Select a valid property status.';
  }

  const contactDigitCount = contactNumber.replace(/\D/g, '').length;

  if (
    contactNumber &&
    !errors.contactNumber &&
    (
      !CONTACT_NUMBER_PATTERN.test(contactNumber) ||
      contactDigitCount < 7 ||
      contactDigitCount > 15
    )
  ) {
    errors.contactNumber =
      'Enter a valid contact number containing 7 to 15 digits.';
  }

  return {
    errors,
    payload: {
      title,
      propertyType,
      description,
      price,
      city,
      address,
      bedrooms,
      bathrooms,
      area,
      imageUrl,
      propertyStatus,
      contactNumber,
    },
  };
}
