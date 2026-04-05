import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  BibleVerse,
  SearchResult,
  SearchOptions,
  SupportedLanguage,
} from '../../types/models';
import { MAX_SEARCH_RESULTS } from '../../constants/config';
import { VerseRepository } from '../../db/repositories/VerseRepository';
import { normalize } from './QueryNormalizer';
import { parse } from './ReferenceParser';
import { mapMoodToThemes } from './MoodMapper';
import { normalizedLevenshteinSimilarity } from '../../utils/textSimilarity';

export class SearchEngine {
  private verseRepo: VerseRepository;

  constructor(db: SQLiteDatabase) {
    this.verseRepo = new VerseRepository(db);
  }

  /**
   * Full search pipeline:
   * 1. Normalize query
   * 2. Try reference parse (score: 100)
   * 3. Try FTS text search (score: 80 exact, 60 keyword)
   * 4. Try mood/theme mapping (score: 40)
   * 5. Try fuzzy matching (score: 20)
   * 6. Deduplicate, sort by score, cap at maxResults
   */
  search(query: string, options?: SearchOptions): SearchResult[] {
    const maxResults = options?.maxResults ?? MAX_SEARCH_RESULTS;
    const language = options?.language;
    const normalized = normalize(query);

    if (!normalized) return [];

    const resultMap = new Map<string, SearchResult>();

    // Step 1: Try reference parse
    const ref = parse(normalized);
    if (ref) {
      const verses = this.verseRepo.getByReference(
        ref.bookCode,
        ref.chapter,
        ref.verse,
      );
      for (const verse of verses) {
        this.addResult(resultMap, verse, 100, 'reference');
      }
    }

    // Step 2: FTS search
    const lang =
      language === 'auto' ? undefined : (language as SupportedLanguage | undefined);
    const ftsResults = this.verseRepo.searchFTS(normalized, lang);
    for (const verse of ftsResults) {
      // Check if it's a closer match (exact substring) or just FTS keyword
      const isExact = this.isExactMatch(verse, normalized);
      const score = isExact ? 80 : 60;
      const matchType = isExact ? 'exact' : 'fts';
      this.addResult(resultMap, verse, score, matchType);
    }

    // Step 3: Theme-based search from mood mapping
    const themes =
      options?.themes && options.themes.length > 0
        ? options.themes
        : mapMoodToThemes(query);

    if (themes.length > 0) {
      const themeResults = this.verseRepo.searchByThemes(themes);
      for (const verse of themeResults) {
        this.addResult(resultMap, verse, 40, 'theme');
      }
    }

    // Step 4: Fuzzy matching (only if we have few results)
    if (resultMap.size < 5) {
      this.addFuzzyResults(resultMap, normalized, lang);
    }

    // Sort by score descending, then cap
    const results = Array.from(resultMap.values()).sort(
      (a, b) => b.score - a.score,
    );

    return results.slice(0, maxResults);
  }

  private addResult(
    map: Map<string, SearchResult>,
    verse: BibleVerse,
    score: number,
    matchType: SearchResult['matchType'],
  ): void {
    const existing = map.get(verse.id);
    if (existing) {
      // Keep the higher score
      if (score > existing.score) {
        existing.score = score;
        existing.matchType = matchType;
      }
    } else {
      map.set(verse.id, { verse, score, matchType });
    }
  }

  private isExactMatch(verse: BibleVerse, query: string): boolean {
    const q = query.toLowerCase();
    const textEn = (verse.textEn ?? '').toLowerCase();
    const textTa = (verse.textTa ?? '').toLowerCase();

    return textEn.includes(q) || textTa.includes(q);
  }

  private addFuzzyResults(
    map: Map<string, SearchResult>,
    query: string,
    language?: SupportedLanguage,
  ): void {
    const allVerses = this.verseRepo.getAll();
    const threshold = 0.4;

    for (const verse of allVerses) {
      if (map.has(verse.id)) continue;

      let bestScore = 0;

      // Check keywords similarity
      const keywords =
        language === 'ta' ? verse.keywordsTa : verse.keywordsEn;

      for (const keyword of keywords) {
        const sim = normalizedLevenshteinSimilarity(query, keyword.toLowerCase());
        if (sim > bestScore) bestScore = sim;
      }

      // Also check theme tags
      for (const tag of verse.themeTags) {
        const sim = normalizedLevenshteinSimilarity(query, tag);
        if (sim > bestScore) bestScore = sim;
      }

      if (bestScore >= threshold) {
        this.addResult(map, verse, Math.round(bestScore * 20), 'fuzzy');
      }
    }
  }
}
