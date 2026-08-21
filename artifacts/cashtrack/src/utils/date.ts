/** Formats an ISO timestamp as a short date, e.g. "Jul 14". */
export function formatShortDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Formats an ISO timestamp as a full date, e.g. "July 14, 2026". */
export function formatFullDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Returns the "YYYY-MM" key for the current month, e.g. "2026-07". */
export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Returns true if the given ISO timestamp falls within the given "YYYY-MM" month. */
export function isInMonth(isoTimestamp: string, monthKey: string): boolean {
  return isoTimestamp.startsWith(monthKey);
}
