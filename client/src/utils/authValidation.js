export function validateRequired(value, label) {
  return value.trim() ? '' : `${label} is required.`;
}

export function validateFullName(fullName) {
  const requiredMessage = validateRequired(fullName, 'Full name');
  if (requiredMessage) return requiredMessage;
  if (fullName.trim().length < 2) {
    return 'Full name must be at least 2 characters.';
  }
  if (fullName.trim().length > 120) {
    return 'Full name must not exceed 120 characters.';
  }
  return '';
}

export function validateEmail(email) {
  const requiredMessage = validateRequired(email, 'Email');
  if (requiredMessage) return requiredMessage;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  return '';
}

export function validateRegistrationRole(role) {
  return ['tenant', 'owner'].includes(role)
    ? ''
    : 'Select a valid account type.';
}

export function validatePassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return '';
}

export function validatePasswordConfirmation(confirmPassword, password) {
  if (!confirmPassword) return 'Please confirm your password.';
  if (confirmPassword !== password) return 'Passwords do not match.';
  return '';
}
