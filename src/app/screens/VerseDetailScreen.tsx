import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Share,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useVerseContext } from '@/hooks/useVerseContext';
import { useTTS } from '@/hooks/useTTS';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { PlaybackControls } from '@/components/audio/PlaybackControls';
import { FavoriteButton } from '@/components/verse/FavoriteButton';
import { ContextNavigator } from '@/components/verse/ContextNavigator';
import { CrossReferences } from '@/components/verse/CrossReferences';
import { ChapterSummary } from '@/components/verse/ChapterSummary';
import { HistoricalContext } from '@/components/verse/HistoricalContext';
import { ReflectionRecorder } from '@/components/audio/ReflectionRecorder';
import { MemorizationPlayer } from '@/components/audio/MemorizationPlayer';
import { SectionHeader } from '@/components/common/SectionHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { IconButtonAccessible } from '@/components/common/IconButtonAccessible';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { RootStackParamList } from '@/types/navigation';
import type { BibleVerse } from '@/types/models';

type DetailRoute = RouteProp<RootStackParamList, 'VerseDetail'>;
type DetailNav = NativeStackNavigationProp<RootStackParamList>;

export function VerseDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<DetailNav>();
  const { verseId, autoPlay } = route.params;

  const { currentVerse, previousVerses, nextVerses, loading } =
    useVerseContext(verseId, 2);
  const { speakVerse, speakText, stop, isSpeaking } = useTTS();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const autoPlayOnOpen = useSettingsStore((s) => s.autoPlayVerseOnOpen);

  const [showContext, setShowContext] = useState(false);
  const [showMemorization, setShowMemorization] = useState(false);
  const [showReflection, setShowReflection] = useState(false);

  // Auto-play on open if enabled
  useEffect(() => {
    if (currentVerse && (autoPlay || autoPlayOnOpen)) {
      const timer = setTimeout(() => {
        speakVerse(currentVerse, primaryLanguage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentVerse?.id, autoPlay, autoPlayOnOpen]);

  const getVerseText = useCallback(
    (verse: BibleVerse, lang: 'en' | 'ta'): string => {
      if (lang === 'ta') {
        return verse.textTa ?? verse.textEn ?? '';
      }
      return verse.textEn ?? verse.textTa ?? '';
    },
    []
  );

  const handlePlay = useCallback(() => {
    if (currentVerse) {
      speakVerse(currentVerse, primaryLanguage);
    }
  }, [currentVerse, primaryLanguage, speakVerse]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleRepeat = useCallback(() => {
    if (currentVerse) {
      stop();
      setTimeout(() => speakVerse(currentVerse, primaryLanguage), 100);
    }
  }, [currentVerse, primaryLanguage, speakVerse, stop]);

  const handleShare = useCallback(async () => {
    if (!currentVerse) return;

    const ref = `${currentVerse.bookNameEn} ${currentVerse.chapter}:${currentVerse.verse}`;
    const text = currentVerse.textEn ?? currentVerse.textTa ?? '';
    const message = `${ref}\n\n${text}\n\n- Shared from Heavenly Push`;

    try {
      await Share.share({ message });
    } catch {
      // Share cancelled or error
    }
  }, [currentVerse]);

  const handleNavigateToVerse = useCallback(
    (id: string) => {
      navigation.push('VerseDetail', { verseId: id });
    },
    [navigation]
  );

  const handleVersePress = useCallback(
    (verse: BibleVerse) => {
      navigation.push('VerseDetail', { verseId: verse.id });
    },
    [navigation]
  );

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['bottom']}
      >
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!currentVerse) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['bottom']}
      >
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Verse not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const reference = `${primaryLanguage === 'ta' ? currentVerse.bookNameTa : currentVerse.bookNameEn} ${currentVerse.chapter}:${currentVerse.verse}`;
  const textPrimary = getVerseText(currentVerse, primaryLanguage);
  const textSecondary = getVerseText(
    currentVerse,
    primaryLanguage === 'en' ? 'ta' : 'en'
  );
  const hasSecondaryText =
    primaryLanguage === 'en'
      ? currentVerse.textTa != null
      : currentVerse.textEn != null;

  // Language fallback notice
  const showFallback =
    primaryLanguage === 'ta' && !currentVerse.textTa && currentVerse.textEn;

  useEffect(() => {
    if (showFallback) {
      AccessibilityInfo.announceForAccessibility(
        t('verse.languageFallback', { language: 'Tamil' })
      );
    }
  }, [showFallback, t]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Reference header + actions */}
        <View style={styles.headerRow}>
          <Text
            style={[styles.reference, { color: colors.accent }]}
            accessibilityRole="header"
          >
            {reference}
          </Text>
          <View style={styles.headerActions}>
            <FavoriteButton verseId={currentVerse.id} size={28} />
            <IconButtonAccessible
              iconName="share-outline"
              onPress={handleShare}
              accessibilityLabel={t('verse.share')}
              accessibilityHint="Share this verse"
            />
          </View>
        </View>

        {/* Fallback notice */}
        {showFallback && (
          <Text style={[styles.fallbackNotice, { color: colors.error }]}>
            {t('verse.languageFallback', { language: 'Tamil' })}
          </Text>
        )}

        {/* Primary text */}
        <Text
          style={[styles.verseText, { color: colors.text }]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`${reference}. ${textPrimary}`}
        >
          {textPrimary}
        </Text>

        {/* Secondary language text */}
        {hasSecondaryText && textSecondary && (
          <Text
            style={[styles.secondaryText, { color: colors.textSecondary }]}
            accessible={true}
            accessibilityRole="text"
          >
            {textSecondary}
          </Text>
        )}

        {/* Theme tags */}
        {currentVerse.themeTags.length > 0 && (
          <View style={styles.tagsRow}>
            {currentVerse.themeTags.map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Playback Controls */}
        <PlaybackControls
          onPlay={handlePlay}
          onStop={handleStop}
          onRepeat={handleRepeat}
        />

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <PrimaryButton
            title={t('verse.readContext')}
            onPress={() => setShowContext(!showContext)}
            accessibilityHint={
              showContext ? 'Hide surrounding verses' : 'Show surrounding verses'
            }
          />

          <PrimaryButton
            title={t('verse.memorize')}
            onPress={() => setShowMemorization(!showMemorization)}
            accessibilityHint={
              showMemorization ? 'Hide memorization tool' : 'Start memorizing this verse'
            }
          />

          <PrimaryButton
            title={t('verse.reflection')}
            onPress={() => setShowReflection(!showReflection)}
            accessibilityHint={
              showReflection ? 'Hide reflection recorder' : 'Record a reflection'
            }
          />
        </View>

        {/* Context Navigator */}
        {showContext && (
          <ContextNavigator
            previousVerses={previousVerses}
            nextVerses={nextVerses}
            onNavigateToVerse={handleNavigateToVerse}
          />
        )}

        {/* Chapter Summary */}
        <ChapterSummary
          bookCode={currentVerse.bookCode}
          chapter={currentVerse.chapter}
        />

        {/* Historical Context */}
        <HistoricalContext
          verseId={currentVerse.id}
          bookCode={currentVerse.bookCode}
        />

        {/* Cross References */}
        <CrossReferences
          verseId={currentVerse.id}
          onVersePress={handleVersePress}
        />

        {/* Memorization Player */}
        {showMemorization && (
          <MemorizationPlayer
            verse={currentVerse}
            language={primaryLanguage}
          />
        )}

        {/* Reflection Recorder */}
        {showReflection && (
          <ReflectionRecorder verseId={currentVerse.id} />
        )}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  reference: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  fallbackNotice: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 20,
    lineHeight: 32,
    marginBottom: 16,
  },
  secondaryText: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
    marginVertical: 16,
  },
});
