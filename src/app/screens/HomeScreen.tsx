import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useDailyVerse } from '@/hooks/useDailyVerse';
import { useShakeDetector } from '@/hooks/useShakeDetector';
import { useTTS } from '@/hooks/useTTS';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSearchStore } from '@/stores/useSearchStore';
import { usePlaybackStore } from '@/stores/usePlaybackStore';
import { SectionHeader } from '@/components/common/SectionHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { IconButtonAccessible } from '@/components/common/IconButtonAccessible';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { RootStackParamList } from '@/types/navigation';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const navigation = useNavigation<HomeNav>();
  const { verse, loading } = useDailyVerse();
  const { stop } = useTTS();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const speakingStatus = usePlaybackStore((s) => s.speakingStatus);
  const recentHistory = useSearchStore((s) => s.recentHistory);

  // Shake navigates to Search tab with voice activated
  useShakeDetector(() => {
    (navigation as any).navigate('Main', {
      screen: 'Search',
      params: { voiceActivated: true },
    });
  });

  const handleSearchPress = useCallback(() => {
    (navigation as any).navigate('Main', {
      screen: 'Search',
    });
  }, [navigation]);

  const handleVoiceSearchPress = useCallback(() => {
    (navigation as any).navigate('Main', {
      screen: 'Search',
      params: { voiceActivated: true },
    });
  }, [navigation]);

  const handleDailyVersePress = useCallback(() => {
    if (verse) {
      navigation.navigate('VerseDetail', { verseId: verse.id });
    }
  }, [verse, navigation]);

  const handleMiniBarStop = useCallback(() => {
    stop();
  }, [stop]);

  const verseText = verse
    ? primaryLanguage === 'ta'
      ? verse.textTa ?? verse.textEn ?? ''
      : verse.textEn ?? verse.textTa ?? ''
    : '';

  const verseReference = verse
    ? `${primaryLanguage === 'ta' ? verse.bookNameTa : verse.bookNameEn} ${verse.chapter}:${verse.verse}`
    : '';

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
          {t('home.title')}
        </Text>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          {t('home.greeting', { timeOfDay: getTimeOfDay() })}
        </Text>

        {/* Search Card — single entry point for all search */}
        <Pressable
          onPress={handleSearchPress}
          accessibilityRole="button"
          accessibilityLabel={t('home.searchBible')}
          accessibilityHint="Go to search page"
          style={({ pressed }) => [
            styles.searchCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="search" size={24} color={colors.textSecondary} />
          <Text style={[styles.searchCardText, { color: colors.textSecondary }]}>
            {t('search.placeholder')}
          </Text>
          <Pressable
            onPress={handleVoiceSearchPress}
            accessibilityRole="button"
            accessibilityLabel={t('search.voiceButton')}
            hitSlop={8}
            style={styles.micButton}
          >
            <Ionicons name="mic" size={28} color={colors.accent} />
          </Pressable>
        </Pressable>

        {/* Daily Verse */}
        <SectionHeader title={t('home.dailyVerse')} />
        {loading ? (
          <LoadingSpinner size="small" />
        ) : verse ? (
          <Pressable
            onPress={handleDailyVersePress}
            accessibilityRole="button"
            accessibilityLabel={`${t('home.dailyVerse')}: ${verseReference}. ${verseText}`}
            accessibilityHint="Double tap to view full verse"
            style={({ pressed }) => [
              styles.dailyVerseCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.verseReference, { color: colors.accent }]}>
              {verseReference}
            </Text>
            <Text
              style={[styles.verseText, { color: colors.text }]}
              numberOfLines={4}
            >
              {verseText}
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.noVerse, { color: colors.textSecondary }]}>
            {t('home.noDailyVerse')}
          </Text>
        )}

        {/* Recent Searches */}
        {recentHistory.length > 0 && (
          <>
            <SectionHeader title={t('home.recentSearches')} />
            <FlatList
              data={recentHistory.slice(0, 5)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    (navigation as any).navigate('Main', {
                      screen: 'Search',
                      params: { query: item.query },
                    });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Recent search: ${item.query}`}
                  style={({ pressed }) => [
                    styles.recentItem,
                    {
                      borderColor: colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.recentText, { color: colors.link }]}>
                    {item.query}
                  </Text>
                </Pressable>
              )}
            />
          </>
        )}
      </View>

      {/* Mini playback bar */}
      {speakingStatus !== 'idle' && (
        <View
          style={[
            styles.miniBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          accessible={true}
          accessibilityLabel="Audio playback active"
        >
          <Text
            style={[styles.miniBarText, { color: colors.text }]}
            numberOfLines={1}
          >
            {speakingStatus === 'speaking' ? 'Playing...' : 'Paused'}
          </Text>
          <IconButtonAccessible
            iconName="stop-circle"
            onPress={handleMiniBarStop}
            accessibilityLabel="Stop audio"
            color={colors.error}
          />
        </View>
      )}
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
    marginBottom: 4,
  },
  greeting: {
    fontSize: 18,
    marginBottom: 24,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    minHeight: MIN_TOUCH_SIZE,
    gap: 10,
  },
  searchCardText: {
    fontSize: 16,
    flex: 1,
  },
  micButton: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyVerseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    minHeight: MIN_TOUCH_SIZE,
  },
  verseReference: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
  },
  noVerse: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  recentItem: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  recentText: {
    fontSize: 16,
  },
  miniBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    minHeight: MIN_TOUCH_SIZE + 8,
  },
  miniBarText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});
