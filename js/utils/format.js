/**
 * Format a quote for clipboard copy.
 * @param {Object} quote - Quote object with quote, author fields
 * @returns {string}
 */
export function formatQuoteForCopy(quote) {
  return `"${quote.quote}" \u2014 ${quote.author}`;
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current year as string.
 */
export function currentYear() {
  return new Date().getFullYear().toString();
}
