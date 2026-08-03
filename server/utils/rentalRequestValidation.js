import ApiError from './ApiError.js';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const MAX_MESSAGE_LENGTH = 1000;

function normalizePropertyId(value, details) {
  const normalizedValue =
    typeof value === 'number' && Number.isSafeInteger(value)
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : '';
  const propertyId = Number(normalizedValue);

  if (
    !POSITIVE_INTEGER_PATTERN.test(normalizedValue) ||
    !Number.isSafeInteger(propertyId)
  ) {
    details.propertyId = 'Property ID must be a positive integer.';
  }

  return propertyId;
}

function normalizeMessage(value, details) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    details.message = 'Message must be text.';
    return null;
  }

  const message = value.trim();

  if (!message) {
    return null;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    details.message = `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`;
  }

  return message;
}

export function validateCreateRentalRequestPayload(payload = {}) {
  const source =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload
      : {};
  const details = {};
  const propertyId = normalizePropertyId(source.propertyId, details);
  const message = normalizeMessage(source.message, details);

  if (Object.keys(details).length > 0) {
    throw new ApiError(400, 'Validation failed', details);
  }

  return { propertyId, message };
}
