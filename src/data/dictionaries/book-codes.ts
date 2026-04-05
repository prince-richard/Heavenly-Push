export interface BookInfo {
  code: string;
  nameEn: string;
  nameTa: string;
  aliases: string[];
}

/**
 * All 66 Bible books with their codes, names in English/Tamil, and common aliases.
 */
export const BIBLE_BOOKS: BookInfo[] = [
  // Old Testament
  { code: 'GEN', nameEn: 'Genesis', nameTa: '\u0b86\u0ba4\u0bbf\u0baf\u0bbe\u0b95\u0bae\u0bae\u0bcd', aliases: ['gen', 'genesis'] },
  { code: 'EXO', nameEn: 'Exodus', nameTa: '\u0baf\u0bbe\u0ba4\u0bcd\u0ba4\u0bbf\u0bb0\u0bbe\u0b95\u0bae\u0bae\u0bcd', aliases: ['exo', 'exod', 'exodus'] },
  { code: 'LEV', nameEn: 'Leviticus', nameTa: '\u0bb2\u0bc7\u0bb5\u0bbf\u0baf\u0bb0\u0bbe\u0b95\u0bae\u0bae\u0bcd', aliases: ['lev', 'leviticus'] },
  { code: 'NUM', nameEn: 'Numbers', nameTa: '\u0b8e\u0ba3\u0bcd\u0ba3\u0bbe\u0b95\u0bae\u0bae\u0bcd', aliases: ['num', 'numbers'] },
  { code: 'DEU', nameEn: 'Deuteronomy', nameTa: '\u0b89\u0baa\u0bbe\u0b95\u0bae\u0bae\u0bcd', aliases: ['deu', 'deut', 'deuteronomy'] },
  { code: 'JOS', nameEn: 'Joshua', nameTa: '\u0baf\u0bcb\u0b9a\u0bc1\u0bb5\u0bbe', aliases: ['jos', 'josh', 'joshua'] },
  { code: 'JDG', nameEn: 'Judges', nameTa: '\u0ba8\u0bcd\u0baf\u0bbe\u0baf\u0bbe\u0ba4\u0bbf\u0baa\u0ba4\u0bbf\u0b95\u0bb3\u0bcd', aliases: ['jdg', 'judg', 'judges'] },
  { code: 'RUT', nameEn: 'Ruth', nameTa: '\u0bb0\u0bc2\u0ba4\u0bcd', aliases: ['rut', 'ruth'] },
  { code: '1SA', nameEn: '1 Samuel', nameTa: '1 \u0b9a\u0bbe\u0bae\u0bc1\u0bb5\u0bc7\u0bb2\u0bcd', aliases: ['1sa', '1sam', '1 samuel', '1 sam', 'i samuel', 'i sam'] },
  { code: '2SA', nameEn: '2 Samuel', nameTa: '2 \u0b9a\u0bbe\u0bae\u0bc1\u0bb5\u0bc7\u0bb2\u0bcd', aliases: ['2sa', '2sam', '2 samuel', '2 sam', 'ii samuel', 'ii sam'] },
  { code: '1KI', nameEn: '1 Kings', nameTa: '1 \u0b87\u0bb0\u0bbe\u0b9c\u0bbe\u0b95\u0bcd\u0b95\u0bb3\u0bcd', aliases: ['1ki', '1kgs', '1 kings', '1 kgs', 'i kings', 'i kgs'] },
  { code: '2KI', nameEn: '2 Kings', nameTa: '2 \u0b87\u0bb0\u0bbe\u0b9c\u0bbe\u0b95\u0bcd\u0b95\u0bb3\u0bcd', aliases: ['2ki', '2kgs', '2 kings', '2 kgs', 'ii kings', 'ii kgs'] },
  { code: '1CH', nameEn: '1 Chronicles', nameTa: '1 \u0ba8\u0bbe\u0bb3\u0bbe\u0b95\u0bae\u0bae\u0bcd', aliases: ['1ch', '1chr', '1 chronicles', '1 chr', 'i chronicles', 'i chr'] },
  { code: '2CH', nameEn: '2 Chronicles', nameTa: '2 \u0ba8\u0bbe\u0bb3\u0bbe\u0b95\u0bae\u0bae\u0bcd', aliases: ['2ch', '2chr', '2 chronicles', '2 chr', 'ii chronicles', 'ii chr'] },
  { code: 'EZR', nameEn: 'Ezra', nameTa: '\u0b8e\u0b9a\u0bcd\u0bb0\u0bbe', aliases: ['ezr', 'ezra'] },
  { code: 'NEH', nameEn: 'Nehemiah', nameTa: '\u0ba8\u0bc6\u0b95\u0bc7\u0bae\u0bbf\u0baf\u0bbe', aliases: ['neh', 'nehemiah'] },
  { code: 'EST', nameEn: 'Esther', nameTa: '\u0b8e\u0b9a\u0bcd\u0ba4\u0bb0\u0bcd', aliases: ['est', 'esther'] },
  { code: 'JOB', nameEn: 'Job', nameTa: '\u0baf\u0bcb\u0baa\u0bc1', aliases: ['job'] },
  { code: 'PSA', nameEn: 'Psalms', nameTa: '\u0b9a\u0b99\u0bcd\u0b95\u0bc0\u0ba4\u0bae\u0bcd', aliases: ['psa', 'ps', 'psalm', 'psalms'] },
  { code: 'PRO', nameEn: 'Proverbs', nameTa: '\u0ba8\u0bc0\u0ba4\u0bbf\u0bae\u0bca\u0bb4\u0bbf\u0b95\u0bb3\u0bcd', aliases: ['pro', 'prov', 'proverbs'] },
  { code: 'ECC', nameEn: 'Ecclesiastes', nameTa: '\u0baa\u0bbf\u0bb0\u0b9a\u0b99\u0bcd\u0b95\u0bbf', aliases: ['ecc', 'eccl', 'ecclesiastes'] },
  { code: 'SNG', nameEn: 'Song of Solomon', nameTa: '\u0b89\u0ba9\u0bcd\u0ba9\u0ba4\u0baa\u0bcd\u0baa\u0bbe\u0b9f\u0bcd\u0b9f\u0bc1', aliases: ['sng', 'song', 'song of solomon', 'song of songs', 'sos'] },
  { code: 'ISA', nameEn: 'Isaiah', nameTa: '\u0b8f\u0b9a\u0bbe\u0baf\u0bbe', aliases: ['isa', 'isaiah'] },
  { code: 'JER', nameEn: 'Jeremiah', nameTa: '\u0b8e\u0bb0\u0bc7\u0bae\u0bbf\u0baf\u0bbe', aliases: ['jer', 'jeremiah'] },
  { code: 'LAM', nameEn: 'Lamentations', nameTa: '\u0b8e\u0bb0\u0bc7\u0bae\u0bbf\u0baf\u0bbe\u0bb5\u0bbf\u0ba9\u0bcd \u0b85\u0bb2\u0b9f\u0bcd\u0b9f\u0bb2\u0bcd', aliases: ['lam', 'lamentations'] },
  { code: 'EZK', nameEn: 'Ezekiel', nameTa: '\u0b8e\u0b9a\u0bc7\u0b95\u0bcd\u0b95\u0bbf\u0baf\u0bc7\u0bb2\u0bcd', aliases: ['ezk', 'ezek', 'ezekiel'] },
  { code: 'DAN', nameEn: 'Daniel', nameTa: '\u0ba4\u0bbe\u0ba9\u0bbf\u0baf\u0bc7\u0bb2\u0bcd', aliases: ['dan', 'daniel'] },
  { code: 'HOS', nameEn: 'Hosea', nameTa: '\u0b93\u0b9a\u0bbf\u0baf\u0bbe', aliases: ['hos', 'hosea'] },
  { code: 'JOL', nameEn: 'Joel', nameTa: '\u0baf\u0bcb\u0bb5\u0bc7\u0bb2\u0bcd', aliases: ['jol', 'joel'] },
  { code: 'AMO', nameEn: 'Amos', nameTa: '\u0b86\u0bae\u0bcb\u0b9a\u0bcd', aliases: ['amo', 'amos'] },
  { code: 'OBA', nameEn: 'Obadiah', nameTa: '\u0b93\u0baa\u0ba4\u0bbf\u0baf\u0bbe', aliases: ['oba', 'obadiah', 'obad'] },
  { code: 'JON', nameEn: 'Jonah', nameTa: '\u0baf\u0bcb\u0ba9\u0bbe', aliases: ['jon', 'jonah'] },
  { code: 'MIC', nameEn: 'Micah', nameTa: '\u0bae\u0bc0\u0b95\u0bbe', aliases: ['mic', 'micah'] },
  { code: 'NAM', nameEn: 'Nahum', nameTa: '\u0ba8\u0bbe\u0b95\u0bc2\u0bae\u0bcd', aliases: ['nam', 'nahum', 'nah'] },
  { code: 'HAB', nameEn: 'Habakkuk', nameTa: '\u0b86\u0baa\u0b95\u0bcd\u0b95\u0bc2\u0b95\u0bcd', aliases: ['hab', 'habakkuk'] },
  { code: 'ZEP', nameEn: 'Zephaniah', nameTa: '\u0b9a\u0bc6\u0baa\u0bcd\u0baa\u0ba9\u0bbf\u0baf\u0bbe', aliases: ['zep', 'zeph', 'zephaniah'] },
  { code: 'HAG', nameEn: 'Haggai', nameTa: '\u0b86\u0b95\u0bbe\u0baf\u0bcd', aliases: ['hag', 'haggai'] },
  { code: 'ZEC', nameEn: 'Zechariah', nameTa: '\u0b9a\u0b95\u0bb0\u0bbf\u0baf\u0bbe', aliases: ['zec', 'zech', 'zechariah'] },
  { code: 'MAL', nameEn: 'Malachi', nameTa: '\u0bae\u0bb2\u0bbe\u0b95\u0bcd\u0b95\u0bbf', aliases: ['mal', 'malachi'] },

  // New Testament
  { code: 'MAT', nameEn: 'Matthew', nameTa: '\u0bae\u0ba4\u0bcd\u0ba4\u0bc7\u0baf\u0bc1', aliases: ['mat', 'matt', 'matthew'] },
  { code: 'MRK', nameEn: 'Mark', nameTa: '\u0bae\u0bbe\u0bb1\u0bcd\u0b95\u0bc1', aliases: ['mrk', 'mark'] },
  { code: 'LUK', nameEn: 'Luke', nameTa: '\u0bb2\u0bc2\u0b95\u0bcd\u0b95\u0bbe', aliases: ['luk', 'luke'] },
  { code: 'JHN', nameEn: 'John', nameTa: '\u0baf\u0bcb\u0bb5\u0bbe\u0ba9\u0bcd', aliases: ['jhn', 'john', 'jn'] },
  { code: 'ACT', nameEn: 'Acts', nameTa: '\u0b85\u0baa\u0bcd\u0baa\u0bcb\u0bb8\u0bcd\u0ba4\u0bb2\u0bb0\u0bcd \u0ba8\u0b9f\u0baa\u0b9f\u0bbf\u0b95\u0bb3\u0bcd', aliases: ['act', 'acts'] },
  { code: 'ROM', nameEn: 'Romans', nameTa: '\u0bb0\u0bcb\u0bae\u0bb0\u0bcd', aliases: ['rom', 'romans'] },
  { code: '1CO', nameEn: '1 Corinthians', nameTa: '1 \u0b95\u0bca\u0bb0\u0bbf\u0ba8\u0bcd\u0ba4\u0bbf\u0baf\u0bb0\u0bcd', aliases: ['1co', '1cor', '1 corinthians', '1 cor', 'i corinthians', 'i cor'] },
  { code: '2CO', nameEn: '2 Corinthians', nameTa: '2 \u0b95\u0bca\u0bb0\u0bbf\u0ba8\u0bcd\u0ba4\u0bbf\u0baf\u0bb0\u0bcd', aliases: ['2co', '2cor', '2 corinthians', '2 cor', 'ii corinthians', 'ii cor'] },
  { code: 'GAL', nameEn: 'Galatians', nameTa: '\u0b95\u0bb2\u0bbe\u0ba4\u0bcd\u0ba4\u0bbf\u0baf\u0bb0\u0bcd', aliases: ['gal', 'galatians'] },
  { code: 'EPH', nameEn: 'Ephesians', nameTa: '\u0b8e\u0baa\u0bc7\u0b9a\u0bbf\u0baf\u0bb0\u0bcd', aliases: ['eph', 'ephesians'] },
  { code: 'PHP', nameEn: 'Philippians', nameTa: '\u0baa\u0bbf\u0bb2\u0bbf\u0baa\u0bcd\u0baa\u0bbf\u0baf\u0bb0\u0bcd', aliases: ['php', 'phil', 'philippians'] },
  { code: 'COL', nameEn: 'Colossians', nameTa: '\u0b95\u0bca\u0bb2\u0bcb\u0b9a\u0bc6\u0baf\u0bb0\u0bcd', aliases: ['col', 'colossians'] },
  { code: '1TH', nameEn: '1 Thessalonians', nameTa: '1 \u0ba4\u0bc6\u0b9a\u0bb2\u0bcb\u0ba9\u0bbf\u0b95\u0bcd\u0b95\u0bc7\u0baf\u0bb0\u0bcd', aliases: ['1th', '1thess', '1 thessalonians', '1 thess', 'i thessalonians', 'i thess'] },
  { code: '2TH', nameEn: '2 Thessalonians', nameTa: '2 \u0ba4\u0bc6\u0b9a\u0bb2\u0bcb\u0ba9\u0bbf\u0b95\u0bcd\u0b95\u0bc7\u0baf\u0bb0\u0bcd', aliases: ['2th', '2thess', '2 thessalonians', '2 thess', 'ii thessalonians', 'ii thess'] },
  { code: '1TI', nameEn: '1 Timothy', nameTa: '1 \u0ba4\u0bc0\u0bae\u0bcb\u0ba4\u0bcd\u0ba4\u0bc7\u0baf\u0bc1', aliases: ['1ti', '1tim', '1 timothy', '1 tim', 'i timothy', 'i tim'] },
  { code: '2TI', nameEn: '2 Timothy', nameTa: '2 \u0ba4\u0bc0\u0bae\u0bcb\u0ba4\u0bcd\u0ba4\u0bc7\u0baf\u0bc1', aliases: ['2ti', '2tim', '2 timothy', '2 tim', 'ii timothy', 'ii tim'] },
  { code: 'TIT', nameEn: 'Titus', nameTa: '\u0ba4\u0bc0\u0ba4\u0bcd\u0ba4\u0bc1', aliases: ['tit', 'titus'] },
  { code: 'PHM', nameEn: 'Philemon', nameTa: '\u0baa\u0bbf\u0bb2\u0bc7\u0bae\u0bcb\u0ba9\u0bcd', aliases: ['phm', 'philemon', 'phlm'] },
  { code: 'HEB', nameEn: 'Hebrews', nameTa: '\u0b8e\u0baa\u0bbf\u0bb0\u0bc6\u0baf\u0bb0\u0bcd', aliases: ['heb', 'hebrews'] },
  { code: 'JAS', nameEn: 'James', nameTa: '\u0baf\u0bbe\u0b95\u0bcd\u0b95\u0bcb\u0baa\u0bc1', aliases: ['jas', 'james'] },
  { code: '1PE', nameEn: '1 Peter', nameTa: '1 \u0baa\u0bc7\u0ba4\u0bc1\u0bb0\u0bc1', aliases: ['1pe', '1pet', '1 peter', '1 pet', 'i peter', 'i pet'] },
  { code: '2PE', nameEn: '2 Peter', nameTa: '2 \u0baa\u0bc7\u0ba4\u0bc1\u0bb0\u0bc1', aliases: ['2pe', '2pet', '2 peter', '2 pet', 'ii peter', 'ii pet'] },
  { code: '1JN', nameEn: '1 John', nameTa: '1 \u0baf\u0bcb\u0bb5\u0bbe\u0ba9\u0bcd', aliases: ['1jn', '1john', '1 john', 'i john', 'i jn'] },
  { code: '2JN', nameEn: '2 John', nameTa: '2 \u0baf\u0bcb\u0bb5\u0bbe\u0ba9\u0bcd', aliases: ['2jn', '2john', '2 john', 'ii john', 'ii jn'] },
  { code: '3JN', nameEn: '3 John', nameTa: '3 \u0baf\u0bcb\u0bb5\u0bbe\u0ba9\u0bcd', aliases: ['3jn', '3john', '3 john', 'iii john', 'iii jn'] },
  { code: 'JUD', nameEn: 'Jude', nameTa: '\u0baf\u0bc2\u0ba4\u0bbe', aliases: ['jud', 'jude'] },
  { code: 'REV', nameEn: 'Revelation', nameTa: '\u0bb5\u0bc6\u0bb3\u0bbf\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4\u0bb2\u0bcd', aliases: ['rev', 'revelation', 'revelations'] },
];

/**
 * Lookup map: lowercase alias/name -> book code.
 */
export const aliasToBookCode: Record<string, string> = {};

for (const book of BIBLE_BOOKS) {
  aliasToBookCode[book.nameEn.toLowerCase()] = book.code;
  for (const alias of book.aliases) {
    aliasToBookCode[alias.toLowerCase()] = book.code;
  }
}

/**
 * Lookup map: book code -> BookInfo.
 */
export const bookCodeToInfo: Record<string, BookInfo> = {};

for (const book of BIBLE_BOOKS) {
  bookCodeToInfo[book.code] = book;
}
