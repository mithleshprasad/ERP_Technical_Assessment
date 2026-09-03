const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

// en-IN grouping (lakhs/crores) + the rupee symbol, e.g. ₹1,00,000.00
export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-IN');
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString('en-IN');
}
