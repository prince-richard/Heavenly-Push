import { BibleProvider, ParsedReference, VerseResult, ParallelVerseResult } from './types';
import { BIBLE_VERSIONS, BOOK_CODE_TO_BOLLS_NUMBER } from './version-map';
import { sanitizeHtml } from '../../utils/html-sanitizer';

const BOLLS_BASE_URL = 'https://bolls.life/get-verse';
const REQUEST_TIMEOUT_MS = 5000;

interface BollsResponse {
  pk: number;
  verse: number;
  text: string;
  chapter: number;
  book: number;
}

/**
 * Bible provider using the Bolls.Life free Bible API.
 * Supports KJV (English) and Tamil Bible translations.
 */
export class BollsBibleProvider implements BibleProvider {
  readonly name = 'bolls';

  async getVerse(reference: ParsedReference, version: string): Promise<VerseResult> {
    const versionConfig = BIBLE_VERSIONS[version];
    if (!versionConfig) {
      return {
        reference: reference.raw,
        text: '',
        version,
        found: false,
      };
    }

    const bollsBookNumber = BOOK_CODE_TO_BOLLS_NUMBER[reference.bookCode];
    if (bollsBookNumber === undefined) {
      return {
        reference: reference.raw,
        text: '',
        version,
        found: false,
      };
    }

    const url = `${BOLLS_BASE_URL}/${versionConfig.bollsId}/${bollsBookNumber}/${reference.chapter}/${reference.verse}/`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        return {
          reference: `${reference.book} ${reference.chapter}:${reference.verse}`,
          text: '',
          version: versionConfig.displayName,
          found: false,
        };
      }

      if (!response.ok) {
        throw new Error(`Bolls API returned status ${response.status} for ${url}`);
      }

      const data: BollsResponse = await response.json() as BollsResponse;
      const cleanText = sanitizeHtml(data.text);

      return {
        reference: `${reference.book} ${reference.chapter}:${reference.verse}`,
        text: cleanText,
        version: versionConfig.displayName,
        found: true,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Bolls API request timed out after ${REQUEST_TIMEOUT_MS}ms for ${reference.book} ${reference.chapter}:${reference.verse}`);
      }
      throw new Error(
        `Failed to fetch verse from Bolls API: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getParallelVerse(
    reference: ParsedReference,
    enVersion: string,
    taVersion: string
  ): Promise<ParallelVerseResult> {
    const [english, tamil] = await Promise.allSettled([
      this.getVerse(reference, enVersion),
      this.getVerse(reference, taVersion),
    ]);

    const englishResult: VerseResult = english.status === 'fulfilled'
      ? english.value
      : { reference: reference.raw, text: '', version: enVersion, found: false };

    const tamilResult: VerseResult = tamil.status === 'fulfilled'
      ? tamil.value
      : { reference: reference.raw, text: '', version: taVersion, found: false };

    return {
      reference: `${reference.book} ${reference.chapter}:${reference.verse}`,
      english: englishResult,
      tamil: tamilResult,
    };
  }
}
