/**
 * HTML entity decode map for common entities found in Bible API responses.
 */
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&#x27;': "'",
  '&#x2F;': '/',
  '&mdash;': '\u2014',
  '&ndash;': '\u2013',
  '&hellip;': '\u2026',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
};

/**
 * Strips HTML tags, decodes HTML entities, and normalizes whitespace.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  let text = html;

  // Remove all HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Decode named and numeric HTML entities
  text = text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    // Check named entities
    const decoded = HTML_ENTITIES[entity.toLowerCase()];
    if (decoded) return decoded;

    // Numeric entities: &#123; or &#x1A;
    if (entity.startsWith('&#x') || entity.startsWith('&#X')) {
      const codePoint = parseInt(entity.slice(3, -1), 16);
      if (!isNaN(codePoint)) return String.fromCodePoint(codePoint);
    } else if (entity.startsWith('&#')) {
      const codePoint = parseInt(entity.slice(2, -1), 10);
      if (!isNaN(codePoint)) return String.fromCodePoint(codePoint);
    }

    return entity; // Return as-is if unrecognized
  });

  // Strip Strong's concordance numbers (e.g., "For1063 God2316" → "For God")
  text = text.replace(/([a-zA-Z])(\d{2,5})/g, '$1');

  // Normalize whitespace: collapse multiple spaces/newlines into single space
  text = text.replace(/\s+/g, ' ');

  return text.trim();
}
