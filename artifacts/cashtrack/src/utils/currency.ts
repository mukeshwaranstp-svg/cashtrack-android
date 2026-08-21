/** Formats a number as INR currency, e.g. 8450 -> "₹8,450.00". */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

/** Formats a number as compact INR currency, e.g. 125000 -> "₹1.25L". */
export function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Formats a number as a whole-percent string, e.g. 0.702 -> "70%". */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
