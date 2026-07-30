import ApiError from './ApiError.js';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;
const DECIMAL_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const MAX_PRICE = 9_999_999_999.99;
const MAX_PROPERTY_SIZE = 99_999_999.99;
const MAX_PAGE = 1_000_000;
const MAX_PAGE_LIMIT = 60;
const MAX_DESCRIPTION_LENGTH = 10_000;
const CONTACT_NUMBER_PATTERN = /^\+?[\d\s()-]+$/;

export const PROPERTY_TYPES = Object.freeze([
  'apartment',
  'house',
  'villa',
  'office',
  'studio',
  'portion',
  'room',
  'shop',
]);

export const PROPERTY_SORT_OPTIONS = Object.freeze([
  'newest',
  'oldest',
  'price_asc',
  'price_desc',
]);

export const PROPERTY_STATUSES = Object.freeze([
  'available',
  'rented',
]);

export function validatePropertyId(value) {
  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  const propertyId = Number(normalizedValue);

  if (
    !POSITIVE_INTEGER_PATTERN.test(normalizedValue) ||
    !Number.isSafeInteger(propertyId)
  ) {
    throw new ApiError(400, 'Validation failed', {
      id: 'Property ID must be a positive integer.',
    });
  }

  return propertyId;
}

function normalizeRequiredText(
  value,
  fieldName,
  label,
  maxLength,
  details,
) {
  if (typeof value !== 'string') {
    details[fieldName] = `${label} is required.`;
    return '';
  }

  const normalizedValue = value.trim().replace(/\s+/g, ' ');

  if (!normalizedValue) {
    details[fieldName] = `${label} is required.`;
  } else if (normalizedValue.length > maxLength) {
    details[fieldName] = `${label} must not exceed ${maxLength} characters.`;
  }

  return normalizedValue;
}

function normalizeRequiredDecimal(
  value,
  fieldName,
  label,
  maximumValue,
  details,
) {
  const normalizedValue =
    typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : '';
  const numberValue = Number(normalizedValue);

  if (!normalizedValue) {
    details[fieldName] = `${label} is required.`;
  } else if (
    !DECIMAL_PATTERN.test(normalizedValue) ||
    !Number.isFinite(numberValue) ||
    numberValue <= 0
  ) {
    details[fieldName] =
      `${label} must be a positive number with up to two decimal places.`;
  } else if (numberValue > maximumValue) {
    details[fieldName] = `${label} must not exceed ${maximumValue}.`;
  }

  return numberValue;
}

function normalizeRequiredPositiveInteger(
  value,
  fieldName,
  label,
  maximumValue,
  details,
) {
  const normalizedValue =
    typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : '';
  const numberValue = Number(normalizedValue);

  if (!normalizedValue) {
    details[fieldName] = `${label} is required.`;
  } else if (
    !POSITIVE_INTEGER_PATTERN.test(normalizedValue) ||
    !Number.isSafeInteger(numberValue) ||
    numberValue > maximumValue
  ) {
    details[fieldName] =
      `${label} must be a positive integer no greater than ${maximumValue}.`;
  }

  return numberValue;
}

function normalizeImageUrl(value, details) {
  const imageUrl = normalizeRequiredText(
    value,
    'imageUrl',
    'Image URL',
    500,
    details,
  );

  if (!imageUrl || details.imageUrl) {
    return imageUrl;
  }

  try {
    const parsedUrl = new URL(imageUrl);

    if (
      !['http:', 'https:'].includes(parsedUrl.protocol) ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      throw new TypeError('Unsupported image URL.');
    }
  } catch {
    details.imageUrl = 'Enter a valid HTTP or HTTPS image URL.';
  }

  return imageUrl;
}

function normalizeContactNumber(value, details) {
  const contactNumber = normalizeRequiredText(
    value,
    'contactNumber',
    'Contact number',
    25,
    details,
  );

  if (!contactNumber || details.contactNumber) {
    return contactNumber;
  }

  const digitCount = contactNumber.replace(/\D/g, '').length;

  if (
    !CONTACT_NUMBER_PATTERN.test(contactNumber) ||
    digitCount < 7 ||
    digitCount > 15
  ) {
    details.contactNumber =
      'Enter a valid contact number containing 7 to 15 digits.';
  }

  return contactNumber;
}

export function validateCreatePropertyPayload(payload = {}) {
  const source =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload
      : {};
  const details = {};
  const title = normalizeRequiredText(
    source.title,
    'title',
    'Property title',
    180,
    details,
  );
  const propertyType = normalizeRequiredText(
    source.propertyType,
    'propertyType',
    'Property type',
    30,
    details,
  ).toLowerCase();
  const description = normalizeRequiredText(
    source.description,
    'description',
    'Description',
    MAX_DESCRIPTION_LENGTH,
    details,
  );
  const price = normalizeRequiredDecimal(
    source.price,
    'price',
    'Price',
    MAX_PRICE,
    details,
  );
  const city = normalizeRequiredText(
    source.city,
    'city',
    'City',
    100,
    details,
  );
  const address = normalizeRequiredText(
    source.address,
    'address',
    'Full address',
    255,
    details,
  );
  const bedrooms = normalizeRequiredPositiveInteger(
    source.bedrooms,
    'bedrooms',
    'Bedrooms',
    65_535,
    details,
  );
  const bathrooms = normalizeRequiredDecimal(
    source.bathrooms,
    'bathrooms',
    'Bathrooms',
    99.9,
    details,
  );
  const area = normalizeRequiredDecimal(
    source.area,
    'area',
    'Area',
    MAX_PROPERTY_SIZE,
    details,
  );
  const imageUrl = normalizeImageUrl(source.imageUrl, details);
  const propertyStatus = normalizeRequiredText(
    source.propertyStatus,
    'propertyStatus',
    'Property status',
    20,
    details,
  ).toLowerCase();
  const contactNumber = normalizeContactNumber(
    source.contactNumber,
    details,
  );

  if (propertyType && !PROPERTY_TYPES.includes(propertyType)) {
    details.propertyType =
      `Property type must be one of: ${PROPERTY_TYPES.join(', ')}.`;
  }

  if (propertyStatus && !PROPERTY_STATUSES.includes(propertyStatus)) {
    details.propertyStatus =
      `Property status must be one of: ${PROPERTY_STATUSES.join(', ')}.`;
  }

  if (Object.keys(details).length > 0) {
    throw new ApiError(400, 'Validation failed', details);
  }

  return {
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
  };
}

function normalizeOptionalText(value, fieldName, maxLength, details) {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    details[fieldName] = `${fieldName} must be a single text value.`;
    return undefined;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  if (normalizedValue.length > maxLength) {
    details[fieldName] = `${fieldName} must not exceed ${maxLength} characters.`;
    return undefined;
  }

  return normalizedValue;
}

function normalizeOptionalPrice(value, fieldName, details) {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (typeof value !== 'string' || !DECIMAL_PATTERN.test(value.trim())) {
    details[fieldName] = `${fieldName} must be a non-negative amount with up to two decimal places.`;
    return undefined;
  }

  const normalizedValue = Number(value);

  if (!Number.isFinite(normalizedValue) || normalizedValue > MAX_PRICE) {
    details[fieldName] = `${fieldName} must not exceed ${MAX_PRICE}.`;
    return undefined;
  }

  return normalizedValue;
}

function normalizePositiveInteger(
  value,
  fieldName,
  defaultValue,
  maximumValue,
  details,
) {
  if (value === undefined) {
    return defaultValue;
  }

  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  const numberValue = Number(normalizedValue);

  if (
    !POSITIVE_INTEGER_PATTERN.test(normalizedValue) ||
    !Number.isSafeInteger(numberValue) ||
    numberValue > maximumValue
  ) {
    details[fieldName] =
      `${fieldName} must be a positive integer no greater than ${maximumValue}.`;
    return defaultValue;
  }

  return numberValue;
}

export function validatePropertyQuery(query = {}) {
  const details = {};
  const search = normalizeOptionalText(query.search, 'search', 200, details);
  const city = normalizeOptionalText(query.city, 'city', 100, details);
  const propertyTypeValue = normalizeOptionalText(
    query.propertyType,
    'propertyType',
    30,
    details,
  );
  const propertyType = propertyTypeValue?.toLowerCase();
  const minPrice = normalizeOptionalPrice(query.minPrice, 'minPrice', details);
  const maxPrice = normalizeOptionalPrice(query.maxPrice, 'maxPrice', details);
  const bedroomsValue = normalizeOptionalText(
    query.bedrooms,
    'bedrooms',
    5,
    details,
  );
  let bedrooms;

  if (propertyType && !PROPERTY_TYPES.includes(propertyType)) {
    details.propertyType = `propertyType must be one of: ${PROPERTY_TYPES.join(', ')}.`;
  }

  if (bedroomsValue !== undefined) {
    bedrooms = Number(bedroomsValue);

    if (
      !NON_NEGATIVE_INTEGER_PATTERN.test(bedroomsValue) ||
      !Number.isSafeInteger(bedrooms) ||
      bedrooms > 65_535
    ) {
      details.bedrooms =
        'bedrooms must be a non-negative integer no greater than 65535.';
    }
  }

  const sortValue =
    normalizeOptionalText(query.sort, 'sort', 30, details)?.toLowerCase() ||
    'newest';

  if (!PROPERTY_SORT_OPTIONS.includes(sortValue)) {
    details.sort = `sort must be one of: ${PROPERTY_SORT_OPTIONS.join(', ')}.`;
  }

  const page = normalizePositiveInteger(
    query.page,
    'page',
    1,
    MAX_PAGE,
    details,
  );
  const limit = normalizePositiveInteger(
    query.limit,
    'limit',
    9,
    MAX_PAGE_LIMIT,
    details,
  );

  if (
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice
  ) {
    details.priceRange = 'minPrice must be less than or equal to maxPrice.';
  }

  if (Object.keys(details).length > 0) {
    throw new ApiError(400, 'Validation failed', details);
  }

  return {
    search,
    city,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    sort: sortValue,
    page,
    limit,
  };
}
