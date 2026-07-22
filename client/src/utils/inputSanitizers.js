export function sanitizeDigits(value) {
  return value.replace(/[^\d]/g, '');
}

export function sanitizeFullName(value) {
  return value.replace(/[^a-zA-Z\s'-]/g, '');
}
