import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useVoiceController } from '@/hooks/useVoiceController';
import { useTTS } from '@/hooks/useTTS';
import { useSearchStore } from '@/stores/useSearchStore';
import { useVoiceStore } from '@/stores/useVoiceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilterPills } from '@/components/search/SearchFilterPills';
import { ResultList } from '@/components/search/ResultList';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { RootStackParamList, TabParamList } from '@/types/navigation';
import type { BibleVerse, SupportedLanguage } from '@/types/models';
import { useDatabase } from '@/contexts/DatabaseContext';
import { SearchEngine } from '@/services/search/SearchEngine';
import { SearchHistoryRepository } from '@/db/repositories/SearchHistoryRepository';

type SearchNav = NativeStackNavigationProp<RootStackParamList>;
type SearchRoute = RouteProp<TabParamList, 'Search'>;

type LanguageFilter = 'all' | 'en' | 'ta';

export function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const navigation = useNavigation<SearchNav>();
  const route = useRoute<SearchRoute>();
  const db = useDatabase();
  const { startListening, stopListening, isListening } = useVoiceController();
  const { speakText } = useTTS();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);

  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const results = useSearchStore((s) => s.results);
  const setResults = useSearchStore((s) => s.setResults);
  const loading = useSearchStore((s) => s.loading);
  const setLoading = useSearchStore((s) => s.setLoading);
  const setRecentHistory = useSearchStore((s) => s.setRecentHistory);

  const transcript = useVoiceStore((s) => s.transcript);

  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>('all');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const lastTranscriptRef = useRef('');

  // Handle route params (query passed from other screens)
  useEffect(() => {
    if (route.params?.query) {
      setQuery(route.params.query);
      void performSearch(route.params.query);
    }
  }, [route.params?.query]);

  // Auto-activate voice when navigated with voiceActivated=true
  useEffect(() => {
    if (route.params?.voiceActivated && !isListening) {
      const timer = setTimeout(() => {
        startListening();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [route.params?.voiceActivated]);

  // Auto-populate from voice transcript
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      setQuery(transcript);
      void performSearch(transcript);
    }
  }, [transcript]);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      try {
        const engine = new SearchEngine(db);
        const langOption: SupportedLanguage | 'auto' =
          languageFilter === 'all' ? 'auto' : languageFilter;

        const searchResults = await engine.search(trimmed, {
          language: langOption,
          themes: selectedThemes.length > 0 ? selectedThemes : undefined,
        });

        setResults(searchResults);

        // Announce result count for screen readers
        if (searchResults.length > 0) {
          AccessibilityInfo.announceForAccessibility(
            t('search.resultsCount', { count: searchResults.length }),
          );
        } else {
          AccessibilityInfo.announceForAccessibility(t('search.noResults'));
          // Speak "no results" for voice-first users
          void speakText(t('search.noResults'), primaryLanguage);
        }

        // Save to search history
        const historyRepo = new SearchHistoryRepository(db);
        await historyRepo.add(trimmed, langOption);

        // Refresh recent history in store
        const recent = await historyRepo.getRecent(10);
        setRecentHistory(recent);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [
      db,
      languageFilter,
      selectedThemes,
      primaryLanguage,
      t,
      setResults,
      setLoading,
      setRecentHistory,
      speakText,
    ],
  );

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      if (text.trim()) {
        void performSearch(text);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    },
    [setQuery, performSearch, setResults],
  );

  const handleVoicePress = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleVersePress = useCallback(
    (verse: BibleVerse) => {
      navigation.navigate('VerseDetail', { verseId: verse.id });
    },
    [navigation],
  );

  const handleLanguageChange = useCallback((lang: LanguageFilter) => {
    setLanguageFilter(lang);
  }, []);

  const handleThemeToggle = useCallback((theme: string) => {
    setSelectedThemes((prev) =>
      prev.includes(theme)
        ? prev.filter((t) => t !== theme)
        : [...prev, theme],
    );
  }, []);

  // Re-search when filters change
  useEffect(() => {
    if (query.trim()) {
      void performSearch(query);
    }
  }, [languageFilter, selectedThemes]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      <View style={styles.container}>
        {/* Header */}
        <Text
          style={[styles.title, { color: colors.accent }]}
          accessibilityRole="header"
        >
          {t('search.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('search.placeholder')}
        </Text>

        {/* Search Input Card */}
        <View
          style={[
            styles.searchCard,
            {
              backgroundColor: colors.cardElevated,
              borderColor: colors.border,
              ...Platform.select({
                ios: {
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                },
                android: { elevation: 3 },
                default: {},
              }),
            },
          ]}
        >
          <SearchBar
            value={query}
            onChangeText={handleChangeText}
            onSubmit={(text) => void performSearch(text)}
            onVoicePress={handleVoicePress}
          />
        </View>

        {/* Filter Pills */}
        <SearchFilterPills
          selectedLanguage={languageFilter}
          selectedThemes={selectedThemes}
          onLanguageChange={handleLanguageChange}
          onThemeToggle={handleThemeToggle}
        />

        {/* Results */}
        {loading ? (
          <LoadingSpinner size="large" />
        ) : results.length > 0 ? (
          <ResultList results={results} onVersePress={handleVersePress} />
        ) : hasSearched && query.trim() ? (
          <EmptyState
            icon="book-outline"
            title={t('search.noResults')}
            subtitle={t('search.noResultsHint')}
          />
        ) : !hasSearched ? (
          <View style={styles.promptContainer}>
            <View
              style={[
                styles.promptIconContainer,
                { backgroundColor: colors.accentLight + '20' },
              ]}
            >
              <Text style={styles.promptEmoji}>{'\u{1F4D6}'}</Text>
            </View>
            <Text style={[styles.promptTitle, { color: colors.text }]}>
              {t('search.title')}
            </Text>
            <Text
              style={[styles.promptHint, { color: colors.textSecondary }]}
            >
              Try a verse reference like "John 3:16" or a topic like "love"
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    marginBottom: 16,
  },
  searchCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  promptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  promptIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  promptEmoji: {
    fontSize: 36,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  promptHint: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
});
