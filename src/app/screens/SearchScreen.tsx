import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
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
        return;
      }

      setLoading(true);
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
            t('search.resultsCount', { count: searchResults.length })
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
    [db, languageFilter, selectedThemes, primaryLanguage, t, setResults, setLoading, setRecentHistory, speakText]
  );

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      if (text.trim()) {
        void performSearch(text);
      } else {
        setResults([]);
      }
    },
    [setQuery, performSearch, setResults]
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
    [navigation]
  );

  const handleLanguageChange = useCallback((lang: LanguageFilter) => {
    setLanguageFilter(lang);
  }, []);

  const handleThemeToggle = useCallback((theme: string) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
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
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
        >
          {t('search.title')}
        </Text>

        {/* Search Bar */}
        <SearchBar
          value={query}
          onChangeText={handleChangeText}
          onSubmit={(text) => void performSearch(text)}
          onVoicePress={handleVoicePress}
        />

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
        ) : query.trim() ? (
          <EmptyState
            icon="search-outline"
            title={t('search.noResults')}
            subtitle={t('search.noResultsHint')}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
});
