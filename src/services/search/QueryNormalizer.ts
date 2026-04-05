/**
 * Normalizes a search query for consistent processing.
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips extra punctuation (keeps colons for verse references and hyphens)
 * - Collapses multiple spaces into one
 */
export function normalize(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s:.\-\u0B80-\u0BFF]/g, '') // Keep word chars, spaces, colons, dots, hyphens, Tamil chars
    .replace(/\s+/g, ' ')
    .trim();
}
