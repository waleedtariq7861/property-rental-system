import ApiError from './ApiError.js';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;
const PRICE_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const MAX_PRICE = 9_999_999_999.99;
const MAX_PAGE = 1_000_000;
const MAX_PAGE_LIMIT = 60;

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

  if (typeof value !== 'string' || !PRICE_PATTERN.test(value.trim())) {
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
