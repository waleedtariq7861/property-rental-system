export const propertyPriceFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
});

const propertyDateFormatter = new Intl.DateTimeFormat('en-PK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const PROPERTY_SIZE_UNITS = Object.freeze({
  sq_ft: 'Sq. Ft.',
  sq_m: 'Sq. M.',
  marla: 'Marla',
  kanal: 'Kanal',
});

export function formatPropertyType(propertyType = '') {
  return propertyType
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatPropertyCount(value, singular, plural) {
  return `${value} ${Number(value) === 1 ? singular : plural}`;
}

export function formatPropertySizeUnit(sizeUnit = 'sq_ft') {
  return PROPERTY_SIZE_UNITS[sizeUnit] || formatPropertyType(sizeUnit);
}

export function formatPropertyArea(value, sizeUnit) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 'Area unavailable';
  }

  return `${numericValue.toLocaleString('en-PK')} ${formatPropertySizeUnit(sizeUnit)}`;
}

export function formatPropertyDate(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : propertyDateFormatter.format(date);
}
