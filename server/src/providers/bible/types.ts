export interface ParsedReference {
  book: string;       // e.g., "John"
  bookCode: string;   // e.g., "JHN" (3-letter code)
  chapter: number;
  verse: number;
  raw: string;        // original user input
}

export interface VerseResult {
  reference: string;  // "John 3:16"
  text: string;       // cleaned verse text
  version: string;    // "KJV"
  found: boolean;
}

export interface ParallelVerseResult {
  reference: string;
  english: VerseResult;
  tamil: VerseResult;
}

export interface BibleProvider {
  getVerse(reference: ParsedReference, version: string): Promise<VerseResult>;
  getParallelVerse(reference: ParsedReference, enVersion: string, taVersion: string): Promise<ParallelVerseResult>;
  readonly name: string;
}
