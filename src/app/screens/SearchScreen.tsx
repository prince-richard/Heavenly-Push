import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  Platform,
  FlatList,
  Pressable,
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
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { RootStackParamList, TabParamList } from '@/types/navigation';
import { aiSearch, type AiSearchHit } from '@/services/ai/AiBibleService';

type SearchNav = NativeStackNavigationProp<RootStackParamList>;
type SearchRoute = RouteProp<TabParamList, 'Search'>;

export function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const navigation = useNavigation<SearchNav>();
  const route = useRoute<SearchRoute>();
  const { startListening, stopListening, isListening } = useVoiceController();
  const { speakText } = useTTS();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);

  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);

  const transcript = useVoiceStore((s) => s.transcript);

  const [hits, setHits] = useState<AiSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastTranscriptRef = useRef('');

  const performSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setHits([]);
        setHasSearched(false);
        setErrorMsg(null);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      setErrorMsg(null);
      try {
        const result = await aiSearch(trimmed, primaryLanguage, 8);
        setHits(result.hits);

        if (result.hits.length > 0) {
          AccessibilityInfo.announceForAccessibility(
            t('search.resultsCount', { count: result.hits.length }),
          );
        } else {
          AccessibilityInfo.announceForAccessibility(t('search.noResults'));
          void speakText(t('search.noResults'), primaryLanguage);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search failed';
        setErrorMsg(msg);
        setHits([]);
        AccessibilityInfo.announceForAccessibility('Search failed');
      } finally {
        setLoading(false);
      }
    },
    [primaryLanguage, t, speakText],
  );

  // Handle route param query
  useEffect(() => {
    if (route.params?.query) {
      setQuery(route.params.query);
      void performSearch(route.params.query);
    }
  }, [route.params?.query, setQuery, performSearch]);

  // Auto-activate voice
  useEffect(() => {
    if (route.params?.voiceActivated && !isListening) {
      const timer = setTimeout(() => {
        void startListening();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [route.params?.voiceActivated, isListening, startListening]);

  // Auto-populate from voice transcript
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      setQuery(transcript);
      void performSearch(transcript);
    }
  }, [transcript, setQuery, performSearch]);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      if (text.trim()) {
        void performSearch(text);
      } else {
        setHits([]);
        setHasSearched(false);
      }
    },
    [setQuery, performSearch],
  );

  const handleVoicePress = useCallback(() => {
    if (isListening) {
      void stopListening();
    } else {
      void startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleHitPress = useCallback(
    (hit: AiSearchHit) => {
      navigation.navigate('VerseDetail', { reference: hit.reference });
    },
    [navigation],
  );

  const renderHit = useCallback(
    ({ item }: { item: AiSearchHit }) => {
      const text =
        primaryLanguage === 'ta'
          ? item.tamilText || item.englishText
          : item.englishText || item.tamilText;
      return (
        <Pressable
          onPress={() => handleHitPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.reference}. ${text}`}
          accessibilityHint="Double tap to open this verse"
          style={({ pressed }) => [
            styles.hitCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Text style={[styles.hitReference, { color: colors.accent }]}>
            {item.reference}
          </Text>
          {text ? (
            <Text
              style={[styles.hitText, { color: colors.text }]}
              numberOfLines={4}
            >
              {text}
            </Text>
          ) : null}
          {item.snippet ? (
            <Text
              style={[styles.hitSnippet, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.snippet}
            </Text>
          ) : null}
        </Pressable>
      );
    },
    [colors, primaryLanguage, handleHitPress],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      <View style={styles.container}>
        <Text
          style={[styles.title, { color: colors.accent }]}
          accessibilityRole="header"
        >
          {t('search.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('search.placeholder')}
        </Text>

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

        {loading ? (
          <LoadingSpinner size="large" />
        ) : errorMsg ? (
          <EmptyState
            icon="alert-circle-outline"
            title={t('search.searchFailed', { defaultValue: 'Search failed' })}
            subtitle={errorMsg}
          />
        ) : hits.length > 0 ? (
          <FlatList
            data={hits}
            keyExtractor={(item, i) => `${item.reference}-${i}`}
            renderItem={renderHit}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : hasSearched && query.trim() ? (
          <EmptyState
            icon="book-outline"
            title={t('search.noResults')}
            subtitle={t('search.noResultsHint')}
          />
        ) : (
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
              Ask anything — a reference like "John 3:16", a topic like "hope",
              or a question like "what does the Bible say about forgiveness?"
            </Text>
          </View>
        )}
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
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  hitCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: MIN_TOUCH_SIZE,
  },
  hitReference: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  hitText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    marginBottom: 6,
  },
  hitSnippet: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
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
