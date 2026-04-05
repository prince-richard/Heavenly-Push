import { aliasToBookCode } from '../../data/dictionaries/book-codes';

export interface ParsedReference {
  bookCode: string;
  chapter: number;
  verse?: number;
}

/**
 * Attempts to parse a Bible reference from a query string.
 *
 * Handles formats like:
 * - "John 3:16"
 * - "Jhn 3:16"
 * - "1 Corinthians 13:4"
 * - "Ps 23"
 * - "Genesis 1:1-3" (returns verse 1)
 * - "1 cor 13:4"
 */
export function parse(query: string): ParsedReference | null {
  const trimmed = query.trim().toLowerCase();

  // Match patterns like: [optional number + space] book_name [space] chapter [:verse[-endverse]]
  // Example: "1 corinthians 13:4-7" or "john 3:16" or "ps 23"
  const match = trimmed.match(
    /^(\d?\s*[a-z]+(?:\s+of\s+[a-z]+)?)\s+(\d+)(?::(\d+)(?:-\d+)?)?$/,
  );

  if (!match) return null;

  const bookPart = match[1].replace(/\s+/g, ' ').trim();
  const chapter = parseInt(match[2], 10);
  const verse = match[3] ? parseInt(match[3], 10) : undefined;

  // Try to find the book code
  const bookCode = aliasToBookCode[bookPart];
  if (!bookCode) return null;

  if (isNaN(chapter) || chapter <= 0) return null;
  if (verse !== undefined && (isNaN(verse) || verse <= 0)) return null;

  return { bookCode, chapter, verse };
}
