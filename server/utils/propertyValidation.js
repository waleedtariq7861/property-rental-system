import ApiError from './ApiError.js';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

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
