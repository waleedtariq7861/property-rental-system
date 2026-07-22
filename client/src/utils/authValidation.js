export function validateRequired(value, label) {
  return value.trim() ? '' : `${label} is required.`;
}

export function validateEmail(email) {
  const requiredMessage = validateRequired(email, 'Email');
  if (requiredMessage) return requiredMessage;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  return '';
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
