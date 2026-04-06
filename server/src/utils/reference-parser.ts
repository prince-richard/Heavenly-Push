import { ParsedReference } from '../providers/bible/types';

interface BookEntry {
  code: string;
  nameEn: string;
  aliases: string[];
}

/**
 * All 66 Bible books with codes and aliases, matching the frontend book-codes.ts.
 */
const BIBLE_BOOKS: BookEntry[] = [
  // Old Testament
  { code: 'GEN', nameEn: 'Genesis', aliases: ['gen', 'genesis'] },
  { code: 'EXO', nameEn: 'Exodus', aliases: ['exo', 'exod', 'exodus'] },
  { code: 'LEV', nameEn: 'Leviticus', aliases: ['lev', 'leviticus'] },
  { code: 'NUM', nameEn: 'Numbers', aliases: ['num', 'numbers'] },
  { code: 'DEU', nameEn: 'Deuteronomy', aliases: ['deu', 'deut', 'deuteronomy'] },
  { code: 'JOS', nameEn: 'Joshua', aliases: ['jos', 'josh', 'joshua'] },
  { code: 'JDG', nameEn: 'Judges', aliases: ['jdg', 'judg', 'judges'] },
  { code: 'RUT', nameEn: 'Ruth', aliases: ['rut', 'ruth'] },
  { code: '1SA', nameEn: '1 Samuel', aliases: ['1sa', '1sam', '1 samuel', '1 sam', 'i samuel', 'i sam'] },
  { code: '2SA', nameEn: '2 Samuel', aliases: ['2sa', '2sam', '2 samuel', '2 sam', 'ii samuel', 'ii sam'] },
  { code: '1KI', nameEn: '1 Kings', aliases: ['1ki', '1kgs', '1 kings', '1 kgs', 'i kings', 'i kgs'] },
  { code: '2KI', nameEn: '2 Kings', aliases: ['2ki', '2kgs', '2 kings', '2 kgs', 'ii kings', 'ii kgs'] },
  { code: '1CH', nameEn: '1 Chronicles', aliases: ['1ch', '1chr', '1 chronicles', '1 chr', 'i chronicles', 'i chr'] },
  { code: '2CH', nameEn: '2 Chronicles', aliases: ['2ch', '2chr', '2 chronicles', '2 chr', 'ii chronicles', 'ii chr'] },
  { code: 'EZR', nameEn: 'Ezra', aliases: ['ezr', 'ezra'] },
  { code: 'NEH', nameEn: 'Nehemiah', aliases: ['neh', 'nehemiah'] },
  { code: 'EST', nameEn: 'Esther', aliases: ['est', 'esther'] },
  { code: 'JOB', nameEn: 'Job', aliases: ['job'] },
  { code: 'PSA', nameEn: 'Psalms', aliases: ['psa', 'ps', 'psalm', 'psalms'] },
  { code: 'PRO', nameEn: 'Proverbs', aliases: ['pro', 'prov', 'proverbs'] },
  { code: 'ECC', nameEn: 'Ecclesiastes', aliases: ['ecc', 'eccl', 'ecclesiastes'] },
  { code: 'SNG', nameEn: 'Song of Solomon', aliases: ['sng', 'song', 'song of solomon', 'song of songs', 'sos'] },
  { code: 'ISA', nameEn: 'Isaiah', aliases: ['isa', 'isaiah'] },
  { code: 'JER', nameEn: 'Jeremiah', aliases: ['jer', 'jeremiah'] },
  { code: 'LAM', nameEn: 'Lamentations', aliases: ['lam', 'lamentations'] },
  { code: 'EZK', nameEn: 'Ezekiel', aliases: ['ezk', 'ezek', 'ezekiel'] },
  { code: 'DAN', nameEn: 'Daniel', aliases: ['dan', 'daniel'] },
  { code: 'HOS', nameEn: 'Hosea', aliases: ['hos', 'hosea'] },
  { code: 'JOL', nameEn: 'Joel', aliases: ['jol', 'joel'] },
  { code: 'AMO', nameEn: 'Amos', aliases: ['amo', 'amos'] },
  { code: 'OBA', nameEn: 'Obadiah', aliases: ['oba', 'obadiah', 'obad'] },
  { code: 'JON', nameEn: 'Jonah', aliases: ['jon', 'jonah'] },
  { code: 'MIC', nameEn: 'Micah', aliases: ['mic', 'micah'] },
  { code: 'NAM', nameEn: 'Nahum', aliases: ['nam', 'nahum', 'nah'] },
  { code: 'HAB', nameEn: 'Habakkuk', aliases: ['hab', 'habakkuk'] },
  { code: 'ZEP', nameEn: 'Zephaniah', aliases: ['zep', 'zeph', 'zephaniah'] },
  { code: 'HAG', nameEn: 'Haggai', aliases: ['hag', 'haggai'] },
  { code: 'ZEC', nameEn: 'Zechariah', aliases: ['zec', 'zech', 'zechariah'] },
  { code: 'MAL', nameEn: 'Malachi', aliases: ['mal', 'malachi'] },
  // New Testament
  { code: 'MAT', nameEn: 'Matthew', aliases: ['mat', 'matt', 'matthew'] },
  { code: 'MRK', nameEn: 'Mark', aliases: ['mrk', 'mark'] },
  { code: 'LUK', nameEn: 'Luke', aliases: ['luk', 'luke'] },
  { code: 'JHN', nameEn: 'John', aliases: ['jhn', 'john', 'jn'] },
  { code: 'ACT', nameEn: 'Acts', aliases: ['act', 'acts'] },
  { code: 'ROM', nameEn: 'Romans', aliases: ['rom', 'romans'] },
  { code: '1CO', nameEn: '1 Corinthians', aliases: ['1co', '1cor', '1 corinthians', '1 cor', 'i corinthians', 'i cor'] },
  { code: '2CO', nameEn: '2 Corinthians', aliases: ['2co', '2cor', '2 corinthians', '2 cor', 'ii corinthians', 'ii cor'] },
  { code: 'GAL', nameEn: 'Galatians', aliases: ['gal', 'galatians'] },
  { code: 'EPH', nameEn: 'Ephesians', aliases: ['eph', 'ephesians'] },
  { code: 'PHP', nameEn: 'Philippians', aliases: ['php', 'phil', 'philippians'] },
  { code: 'COL', nameEn: 'Colossians', aliases: ['col', 'colossians'] },
  { code: '1TH', nameEn: '1 Thessalonians', aliases: ['1th', '1thess', '1 thessalonians', '1 thess', 'i thessalonians', 'i thess'] },
  { code: '2TH', nameEn: '2 Thessalonians', aliases: ['2th', '2thess', '2 thessalonians', '2 thess', 'ii thessalonians', 'ii thess'] },
  { code: '1TI', nameEn: '1 Timothy', aliases: ['1ti', '1tim', '1 timothy', '1 tim', 'i timothy', 'i tim'] },
  { code: '2TI', nameEn: '2 Timothy', aliases: ['2ti', '2tim', '2 timothy', '2 tim', 'ii timothy', 'ii tim'] },
  { code: 'TIT', nameEn: 'Titus', aliases: ['tit', 'titus'] },
  { code: 'PHM', nameEn: 'Philemon', aliases: ['phm', 'philemon', 'phlm'] },
  { code: 'HEB', nameEn: 'Hebrews', aliases: ['heb', 'hebrews'] },
  { code: 'JAS', nameEn: 'James', aliases: ['jas', 'james'] },
  { code: '1PE', nameEn: '1 Peter', aliases: ['1pe', '1pet', '1 peter', '1 pet', 'i peter', 'i pet'] },
  { code: '2PE', nameEn: '2 Peter', aliases: ['2pe', '2pet', '2 peter', '2 pet', 'ii peter', 'ii pet'] },
  { code: '1JN', nameEn: '1 John', aliases: ['1jn', '1john', '1 john', 'i john', 'i jn'] },
  { code: '2JN', nameEn: '2 John', aliases: ['2jn', '2john', '2 john', 'ii john', 'ii jn'] },
  { code: '3JN', nameEn: '3 John', aliases: ['3jn', '3john', '3 john', 'iii john', 'iii jn'] },
  { code: 'JUD', nameEn: 'Jude', aliases: ['jud', 'jude'] },
  { code: 'REV', nameEn: 'Revelation', aliases: ['rev', 'revelation', 'revelations'] },
];

/**
 * Lookup map: lowercase alias/name -> { code, nameEn }
 */
const aliasMap: Map<string, { code: string; nameEn: string }> = new Map();

for (const book of BIBLE_BOOKS) {
  const entry = { code: book.code, nameEn: book.nameEn };
  aliasMap.set(book.nameEn.toLowerCase(), entry);
  for (const alias of book.aliases) {
    aliasMap.set(alias.toLowerCase(), entry);
  }
}

/**
 * Get all known alias strings sorted by length descending (longest first),
 * so "song of solomon" matches before "song".
 */
const sortedAliases: string[] = Array.from(aliasMap.keys()).sort(
  (a, b) => b.length - a.length
);

/**
 * Regex pattern that matches a Bible reference anywhere in text.
 * Captures: book name, chapter, verse (optional), with optional verse range.
 *
 * We build a dynamic pattern from known aliases for the book part,
 * but to handle arbitrary surrounding text (like "Explain Psalm 23:1"),
 * we scan for known book names then parse the chapter:verse after them.
 */

/**
 * Parses a Bible reference from text. Extracts references embedded in
 * natural language questions like "What does Genesis 1:1 mean?"
 *
 * Returns null if no valid reference is found.
 */
export function parseReference(text: string): ParsedReference | null {
  if (!text || typeof text !== 'string') return null;

  const lowerText = text.toLowerCase().trim();

  // Try each known alias (longest first) to find a book name in the text
  for (const alias of sortedAliases) {
    const idx = lowerText.indexOf(alias);
    if (idx === -1) continue;

    // Ensure the alias is at a word boundary:
    // - preceded by start-of-string or non-alphanumeric
    // - BUT allow digit prefix for books like "1 corinthians" — the alias itself contains the digit
    const charBefore = idx > 0 ? lowerText[idx - 1] : ' ';
    if (idx > 0 && /[a-z]/.test(charBefore)) continue;

    // After the alias, look for chapter:verse pattern
    const afterAlias = lowerText.slice(idx + alias.length);
    const cvMatch = afterAlias.match(/^\s+(\d+):(\d+)(?:-\d+)?/);
    if (!cvMatch) {
      // Also try chapter-only (no verse) — skip for our purposes since we need verse
      continue;
    }

    const chapter = parseInt(cvMatch[1], 10);
    const verse = parseInt(cvMatch[2], 10);

    if (chapter <= 0 || verse <= 0) continue;

    const bookEntry = aliasMap.get(alias);
    if (!bookEntry) continue;

    // Reconstruct the raw matched text from the original (preserve case)
    const rawEnd = idx + alias.length + cvMatch[0].length;
    const raw = text.slice(idx, rawEnd).trim();

    return {
      book: bookEntry.nameEn,
      bookCode: bookEntry.code,
      chapter,
      verse,
      raw,
    };
  }

  return null;
}
