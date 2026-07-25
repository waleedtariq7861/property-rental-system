import ApiError from './ApiError.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTRATION_ROLES = new Set(['tenant', 'owner']);
const FULL_NAME_MIN_LENGTH = 2;
const FULL_NAME_MAX_LENGTH = 120;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizeRole(value) {
  return normalizeString(value).toLowerCase();
}

function createValidationError(details) {
  throw new ApiError(400, 'Validation failed', details);
}

export function validateRegisterPayload(payload = {}) {
  const fullName = normalizeString(payload.fullName);
  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === 'string' ? payload.password : '';
  const confirmPassword =
    typeof payload.confirmPassword === 'string' ? payload.confirmPassword : '';
  const role = normalizeRole(payload.role);
  const phone = normalizeString(payload.phone);
  const details = {};

  if (!fullName) {
    details.fullName = 'Full name is required.';
  } else if (fullName.length < FULL_NAME_MIN_LENGTH) {
    details.fullName = `Full name must be at least ${FULL_NAME_MIN_LENGTH} characters long.`;
  } else if (fullName.length > FULL_NAME_MAX_LENGTH) {
    details.fullName = `Full name must not exceed ${FULL_NAME_MAX_LENGTH} characters.`;
  }

  if (!email) {
    details.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    details.email = 'Enter a valid email address.';
  }

  if (!password) {
    details.password = 'Password is required.';
  } else if (password.length < 8) {
    details.password = 'Password must be at least 8 characters long.';
  }

  if (!confirmPassword) {
    details.confirmPassword = 'Password confirmation is required.';
  } else if (confirmPassword !== password) {
    details.confirmPassword = 'Passwords do not match.';
  }

  if (!role) {
    details.role = 'Role is required.';
  } else if (!REGISTRATION_ROLES.has(role)) {
    details.role = 'Select a valid user role.';
  }

  if (Object.keys(details).length > 0) {
    createValidationError(details);
  }

  return {
    fullName,
    email,
    password,
    role,
    phone: phone || null,
  };
}

export function validateLoginPayload(payload = {}) {
  const email = normalizeEmail(payload.email);
  const password = typeof payload.password === 'string' ? payload.password : '';
  const details = {};

  if (!email) {
    details.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    details.email = 'Enter a valid email address.';
  }

  if (!password) {
    details.password = 'Password is required.';
  }

  if (Object.keys(details).length > 0) {
    createValidationError(details);
  }

  return {
    email,
    password,
  };
}
