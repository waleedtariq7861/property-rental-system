export function sanitizeDigits(value) {
  return value.replace(/[^\d]/g, '');
}

export function sanitizeFullName(value) {
  return value.replace(/[^\p{L}\p{M}\s'-]/gu, '');
}
