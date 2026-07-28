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

export function formatPropertyDate(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : propertyDateFormatter.format(date);
}
