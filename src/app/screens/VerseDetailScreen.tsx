import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Share,
  StyleSheet,
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useTTS } from '@/hooks/useTTS';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { usePlaybackStore } from '@/stores/usePlaybackStore';
import {
  getVerseByReference,
  explainVerse,
  type ParallelVerseResponse,
} from '@/services/ai/AiBibleService';
import { PlaybackControls } from '@/components/audio/PlaybackControls';
import { IconButtonAccessible } from '@/components/common/IconButtonAccessible';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { RootStackParamList } from '@/types/navigation';

type DetailRoute = RouteProp<RootStackParamList, 'VerseDetail'>;
type DetailNav = NativeStackNavigationProp<RootStackParamList>;

export function VerseDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<DetailNav>();
  const reference = route.params?.reference ?? route.params?.verseId ?? '';
  const autoPlay = route.params?.autoPlay;

  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const autoPlayOnOpen = useSettingsStore((s) => s.autoPlayVerseOnOpen);
  const { speakText, stop, isSpeaking } = useTTS();
  const setLastAiAnswer = usePlaybackStore((s) => s.setLastAiAnswer);
  const favorites = useFavoritesStore((s) => s.favorites);
  const addFavorite = useFavoritesStore((s) => s.add);
  const removeFavorite = useFavoritesStore((s) => s.remove);

  const [verse, setVerse] = useState<ParallelVerseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setLoadError('No reference provided');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getVerseByReference(reference)
      .then((v) => {
        if (!cancelled) {
          setVerse(v);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load verse');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const englishText = verse?.english?.found ? verse.english.text : '';
  const tamilText = verse?.tamil?.found ? verse.tamil.text : '';
  const primaryText =
    primaryLanguage === 'ta' ? tamilText || englishText : englishText || tamilText;
  const secondaryText =
    primaryLanguage === 'ta' ? englishText : tamilText;

  const isFavorited = favorites.some((f) => f.reference === reference);

  useEffect(() => {
    if (verse && primaryText && (autoPlay || autoPlayOnOpen)) {
      const timer = setTimeout(() => {
        void speakText(primaryText, primaryLanguage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [verse, primaryText, autoPlay, autoPlayOnOpen, speakText, primaryLanguage]);

  const handlePlay = useCallback(() => {
    if (primaryText) {
      void speakText(primaryText, primaryLanguage);
    }
  }, [primaryText, primaryLanguage, speakText]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleRepeat = useCallback(() => {
    if (primaryText) {
      stop();
      setTimeout(() => {
        void speakText(primaryText, primaryLanguage);
      }, 100);
    }
  }, [primaryText, primaryLanguage, speakText, stop]);

  const handleShare = useCallback(async () => {
    if (!verse) return;
    const message = `${reference}\n\n${englishText || tamilText}\n\n- Shared from Heavenly Push`;
    try {
      await Share.share({ message });
    } catch {
      // cancelled or error
    }
  }, [verse, reference, englishText, tamilText]);

  const handleToggleFavorite = useCallback(() => {
    if (!verse) return;
    if (isFavorited) {
      removeFavorite(reference);
      AccessibilityInfo.announceForAccessibility(t('favorites.remove'));
    } else {
      addFavorite({
        reference,
        englishText,
        tamilText,
        snippet: (englishText || tamilText).slice(0, 120),
        language: primaryLanguage,
        savedAt: Date.now(),
      });
      AccessibilityInfo.announceForAccessibility(
        t('favorites.added', { defaultValue: 'Added to favorites' }),
      );
    }
  }, [
    verse,
    isFavorited,
    reference,
    englishText,
    tamilText,
    primaryLanguage,
    addFavorite,
    removeFavorite,
    t,
  ]);

  const handleExplain = useCallback(async () => {
    if (!reference) return;
    setExplainLoading(true);
    setExplainError(null);
    try {
      const res = await explainVerse({
        question: `Explain ${reference}`,
        reference,
        preferredLanguage: primaryLanguage,
        includeParallelText: true,
      });
      setExplanation(res.explanation);
      setLastAiAnswer(res.explanation, primaryLanguage);
      AccessibilityInfo.announceForAccessibility('Explanation ready');
      void speakText(res.explanation, primaryLanguage);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'Failed to get explanation');
    } finally {
      setExplainLoading(false);
    }
  }, [reference, primaryLanguage, speakText, setLastAiAnswer]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={colors.backdropGradient as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading {reference}...
          </Text>
        </View>
      </View>
    );
  }

  if (loadError || !verse) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={colors.backdropGradient as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {loadError || 'Verse not found'}
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={colors.backdropGradient as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text
            style={[styles.reference, { color: colors.gold }]}
            accessibilityRole="header"
          >
            {reference}
          </Text>
          <View style={styles.headerActions}>
            <IconButtonAccessible
              iconName={isFavorited ? 'heart' : 'heart-outline'}
              onPress={handleToggleFavorite}
              accessibilityLabel={
                isFavorited ? 'Remove from favorites' : 'Add to favorites'
              }
              color={isFavorited ? colors.error : colors.text}
              size={28}
            />
            <IconButtonAccessible
              iconName="share-outline"
              onPress={handleShare}
              accessibilityLabel={t('verse.share')}
              accessibilityHint="Share this verse"
            />
          </View>
        </View>

        {/* Primary text in glass card */}
        <View style={[styles.verseCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <Text
            style={[styles.verseText, { color: colors.text }]}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${reference}. ${primaryText}`}
          >
            {primaryText}
          </Text>

          {secondaryText ? (
            <View style={[styles.secondaryDivider, { borderTopColor: colors.glassBorder }]}>
              <Text
                style={[styles.secondaryText, { color: colors.textSecondary }]}
                accessible={true}
                accessibilityRole="text"
              >
                {secondaryText}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Playback controls */}
        <PlaybackControls
          onPlay={handlePlay}
          onStop={handleStop}
          onRepeat={handleRepeat}
        />

        {/* Explain with AI */}
        <View style={styles.actionsContainer}>
          <PrimaryButton
            title={
              explainLoading
                ? t('verse.explaining', { defaultValue: 'Getting explanation...' })
                : t('verse.explain', { defaultValue: 'Explain this verse' })
            }
            onPress={handleExplain}
            disabled={explainLoading}
            accessibilityHint="Get an AI explanation of this verse"
          />
        </View>

        {explainError ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {explainError}
          </Text>
        ) : null}

        {explanation ? (
          <View
            style={[
              styles.explanationCard,
              { backgroundColor: colors.glass, borderColor: colors.glassBorder },
            ]}
          >
            <View style={styles.explanationHeader}>
              <Ionicons name="sparkles" size={18} color={colors.gold} />
              <Text style={[styles.explanationTitle, { color: colors.gold }]}>
                {t('verse.explanation', { defaultValue: 'Explanation' })}
              </Text>
              {isSpeaking ? (
                <IconButtonAccessible
                  iconName="stop-circle-outline"
                  onPress={handleStop}
                  accessibilityLabel="Stop speaking"
                  color={colors.error}
                  size={22}
                />
              ) : null}
            </View>
            <Text
              style={[styles.explanationText, { color: colors.text }]}
              selectable={true}
            >
              {explanation}
            </Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 18,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  reference: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.3,
  },
  verseCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  verseText: {
    fontSize: 20,
    lineHeight: 32,
  },
  secondaryDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 16,
    paddingTop: 16,
  },
  secondaryText: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  actionsContainer: {
    gap: 12,
    marginVertical: 16,
  },
  explanationCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 26,
  },
});
