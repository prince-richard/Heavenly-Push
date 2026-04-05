export type SupportedLanguage = 'en' | 'ta';

export interface BibleVerse {
  id: string;
  translationId: string;
  bookNameEn: string;
  bookNameTa: string;
  bookCode: string;
  chapter: number;
  verse: number;
  textEn?: string;
  textTa?: string;
  transliterationTa?: string;
  keywordsEn: string[];
  keywordsTa: string[];
  themeTags: string[];
}

export interface UserSettings {
  primaryLanguage: SupportedLanguage;
  searchLanguageMode: 'auto' | 'en' | 'ta';
  ttsSpeed: number;
  shakeToSpeakEnabled: boolean;
  hapticsEnabled: boolean;
  dailyPushEnabled: boolean;
  dailyPushTime: string;
  highContrastMode: boolean;
  dynamicTextScale: boolean;
  autoPlayVerseOnOpen: boolean;
}

export interface FavoriteVerse {
  id: string;
  verseId: string;
  createdAt: string;
  customTag?: string;
}

export interface AudioPlan {
  planId: string;
  titleEn: string;
  titleTa: string;
  descriptionEn?: string;
  descriptionTa?: string;
  totalDays: number;
  currentDay: number;
  dailyVerses: string[][];
  completed: boolean;
}

export interface VoiceReflection {
  noteId: string;
  verseId: string;
  audioFileUri: string;
  durationSeconds: number;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  language: SupportedLanguage | 'auto';
  createdAt: string;
}

export interface DailyVerse {
  id: string;
  verseId: string;
  date: string;
}

export interface SearchResult {
  verse: BibleVerse;
  score: number;
  matchType: 'reference' | 'exact' | 'fts' | 'theme' | 'fuzzy';
}

export interface SearchOptions {
  language?: SupportedLanguage | 'auto';
  maxResults?: number;
  themes?: string[];
}
