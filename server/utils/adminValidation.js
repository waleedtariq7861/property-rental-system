import ApiError from './ApiError.js';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const ADMIN_ACCOUNT_STATUSES = new Set(['active', 'deactivated']);

export function validateAdminResourceId(value, field = 'resourceId') {
  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  const resourceId = Number(normalizedValue);

  if (
    !POSITIVE_INTEGER_PATTERN.test(normalizedValue) ||
    !Number.isSafeInteger(resourceId)
  ) {
    throw new ApiError(400, 'Validation failed', {
      [field]: `${field === 'userId' ? 'User' : 'Property'} ID must be a positive integer.`,
    });
  }

  return resourceId;
}

export function validateAdminAccountStatus(payload = {}) {
  const source =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload
      : {};
  const accountStatus =
    typeof source.accountStatus === 'string'
      ? source.accountStatus.trim().toLowerCase()
      : '';

  if (!ADMIN_ACCOUNT_STATUSES.has(accountStatus)) {
    throw new ApiError(400, 'Validation failed', {
      accountStatus: 'Account status must be active or deactivated.',
    });
  }

  return { accountStatus };
}
