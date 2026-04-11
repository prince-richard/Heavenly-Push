import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  AccessibilityInfo,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useShakeDetector } from '@/hooks/useShakeDetector';
import { useTTS } from '@/hooks/useTTS';
import { useVoiceController } from '@/hooks/useVoiceController';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useVoiceStore } from '@/stores/useVoiceStore';
import { usePlaybackStore } from '@/stores/usePlaybackStore';
import {
  chatWithBible,
  getAiDailyVerse,
  type AiDailyVerseResponse,
} from '@/services/ai/AiBibleService';
import { IconButtonAccessible } from '@/components/common/IconButtonAccessible';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { RootStackParamList } from '@/types/navigation';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

type AssistantState = 'idle' | 'listening' | 'processing' | 'responded' | 'error';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const { width: SCREEN_W } = Dimensions.get('window');
const MIC_SIZE = Math.min(SCREEN_W * 0.55, 260);

export function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const navigation = useNavigation<HomeNav>();
  const { speakText, stop: stopTTS, isSpeaking } = useTTS();
  const { startListening, stopListening, isListening } = useVoiceController();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const transcript = useVoiceStore((s) => s.transcript);
  const partialTranscript = useVoiceStore((s) => s.partialTranscript);
  const setLastAiAnswer = usePlaybackStore((s) => s.setLastAiAnswer);

  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiError, setAiError] = useState('');
  const [dailyVerse, setDailyVerse] = useState<AiDailyVerseResponse | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);

  const prevTranscriptRef = useRef('');

  // Load daily verse from AI
  useEffect(() => {
    let cancelled = false;
    setDailyLoading(true);
    getAiDailyVerse(primaryLanguage)
      .then((res) => {
        if (!cancelled) {
          setDailyVerse(res);
          setDailyLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setDailyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [primaryLanguage]);

  // Shake navigates to voice activation immediately on Home
  useShakeDetector(() => {
    if (!isListening) {
      void handleMicPress();
    }
  });

  // When transcript changes and we're in listening state, send to AI
  useEffect(() => {
    if (
      transcript &&
      transcript !== prevTranscriptRef.current &&
      assistantState === 'listening'
    ) {
      prevTranscriptRef.current = transcript;
      setUserQuestion(transcript);
      setAssistantState('processing');
      AccessibilityInfo.announceForAccessibility('Processing your question');

      chatWithBible({
        question: transcript,
        preferredLanguage: primaryLanguage,
      })
        .then((response) => {
          setAiAnswer(response.answer);
          setAssistantState('responded');
          setLastAiAnswer(response.answer, primaryLanguage);
          AccessibilityInfo.announceForAccessibility(
            `Here is the answer: ${response.answer.slice(0, 200)}`,
          );
          void speakText(response.answer, primaryLanguage);
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Something went wrong';
          setAiError(message);
          setAssistantState('error');
          AccessibilityInfo.announceForAccessibility('Sorry, an error occurred');
        });
    }
  }, [transcript, assistantState, primaryLanguage, speakText, setLastAiAnswer]);

  // Sync listening state — revert to idle if mic closed with no transcript
  useEffect(() => {
    if (!isListening && assistantState === 'listening') {
      if (!transcript || transcript === prevTranscriptRef.current) {
        const timer = setTimeout(() => {
          setAssistantState((curr) => (curr === 'listening' ? 'idle' : curr));
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isListening, assistantState, transcript]);

  /**
   * Single-button toggle: tap to start, tap to stop.
   * Also exposed as tap-anywhere-on-hero for easier reach.
   */
  const handleMicPress = useCallback(async () => {
    if (isListening) {
      await stopListening();
      return;
    }

    // New question — reset state
    stopTTS();
    setAiAnswer('');
    setAiError('');
    setUserQuestion('');
    prevTranscriptRef.current = '';
    setAssistantState('listening');
    AccessibilityInfo.announceForAccessibility('Listening. Speak now.');

    await startListening();
  }, [isListening, startListening, stopListening, stopTTS]);

  const handleAskAgain = useCallback(() => {
    stopTTS();
    setAiAnswer('');
    setAiError('');
    setUserQuestion('');
    setAssistantState('idle');
  }, [stopTTS]);

  const handleDailyVersePress = useCallback(() => {
    if (dailyVerse?.reference) {
      navigation.navigate('VerseDetail', { reference: dailyVerse.reference });
    }
  }, [dailyVerse, navigation]);

  const handleSearchPress = useCallback(() => {
    (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate(
      'Main',
      { screen: 'Search' },
    );
  }, [navigation]);

  const handleFavoritesPress = useCallback(() => {
    (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate(
      'Main',
      { screen: 'Favorites' },
    );
  }, [navigation]);

  const handleStopTTS = useCallback(() => {
    stopTTS();
  }, [stopTTS]);

  const verseText = dailyVerse
    ? primaryLanguage === 'ta'
      ? dailyVerse.tamilText || dailyVerse.englishText
      : dailyVerse.englishText || dailyVerse.tamilText
    : '';

  const displayTranscript =
    assistantState === 'listening'
      ? partialTranscript || transcript || ''
      : userQuestion;

  const heroLabel = (() => {
    switch (assistantState) {
      case 'idle':
        return t('home.tapAnywhereToAsk', {
          defaultValue: 'Tap anywhere to ask the Bible. Double tap to start listening.',
        });
      case 'listening':
        return t('home.listeningTapToStop', {
          defaultValue: 'Listening. Double tap to stop.',
        });
      case 'processing':
        return t('home.thinking', { defaultValue: 'Thinking. Please wait.' });
      case 'responded':
        return t('home.tapToAskAnother', {
          defaultValue: 'Tap to ask another question.',
        });
      case 'error':
        return t('home.tapToTryAgain', { defaultValue: 'Tap to try again.' });
    }
  })();

  const statusText = (() => {
    switch (assistantState) {
      case 'idle':
        return t('home.tapToAsk', { defaultValue: 'Tap anywhere to ask' });
      case 'listening':
        return t('home.listening', { defaultValue: 'Listening…' });
      case 'processing':
        return t('home.thinking', { defaultValue: 'Thinking…' });
      default:
        return '';
    }
  })();

  const micIconName: keyof typeof Ionicons.glyphMap =
    assistantState === 'listening' ? 'mic' : 'mic-outline';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          style={[styles.appName, { color: colors.accent }]}
          accessibilityRole="header"
        >
          Heavenly Push
        </Text>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          {getGreeting()}
        </Text>

        {/* HERO — entire card is tappable so visually impaired users
            don't need to aim at the mic button. */}
        <Pressable
          onPress={handleMicPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={heroLabel}
          accessibilityState={{
            busy: assistantState === 'processing',
            selected: assistantState === 'listening',
          }}
          style={({ pressed }) => [
            styles.heroCard,
            {
              backgroundColor: colors.cardElevated,
              borderColor:
                assistantState === 'listening' ? colors.accent : colors.border,
              shadowColor: colors.accent,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <View
            style={[styles.heroAccentStrip, { backgroundColor: colors.accent }]}
          />

          <View style={styles.heroContent}>
            {/* Giant mic button */}
            <View
              style={[
                styles.micButton,
                {
                  backgroundColor:
                    assistantState === 'listening'
                      ? colors.accentDark
                      : colors.accent,
                  shadowColor: colors.accent,
                  borderColor:
                    assistantState === 'listening'
                      ? colors.accent
                      : 'transparent',
                },
              ]}
            >
              {assistantState === 'processing' ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <Ionicons name={micIconName} size={MIC_SIZE * 0.45} color="#FFFFFF" />
              )}
            </View>

            {/* Big status text */}
            {statusText ? (
              <Text
                style={[styles.statusText, { color: colors.text }]}
                accessibilityLiveRegion="polite"
              >
                {statusText}
              </Text>
            ) : null}

            {/* User question / partial transcript */}
            {displayTranscript ? (
              <View
                style={[
                  styles.questionBubble,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.questionText, { color: colors.text }]}>
                  {displayTranscript}
                </Text>
              </View>
            ) : null}

            {/* AI response */}
            {assistantState === 'responded' && aiAnswer ? (
              <View style={styles.answerContainer}>
                <View
                  style={[
                    styles.answerBubble,
                    { backgroundColor: colors.card, borderColor: colors.accent },
                  ]}
                >
                  <ScrollView
                    style={styles.answerScroll}
                    nestedScrollEnabled={true}
                  >
                    <Text
                      style={[styles.answerText, { color: colors.text }]}
                      selectable={true}
                    >
                      {aiAnswer}
                    </Text>
                  </ScrollView>
                </View>

                <View style={styles.responseActions}>
                  <Pressable
                    onPress={handleAskAgain}
                    accessibilityRole="button"
                    accessibilityLabel="Ask another question"
                    style={({ pressed }) => [
                      styles.actionPill,
                      {
                        backgroundColor: colors.accent,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.actionPillText}>Ask again</Text>
                  </Pressable>

                  {isSpeaking ? (
                    <Pressable
                      onPress={handleStopTTS}
                      accessibilityRole="button"
                      accessibilityLabel="Stop speaking"
                      style={({ pressed }) => [
                        styles.actionPill,
                        {
                          backgroundColor: colors.error,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="stop-circle-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.actionPillText}>Stop</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Error */}
            {assistantState === 'error' ? (
              <View style={styles.answerContainer}>
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {aiError || 'Something went wrong. Please try again.'}
                </Text>
                <Pressable
                  onPress={handleAskAgain}
                  accessibilityRole="button"
                  accessibilityLabel="Try again"
                  style={({ pressed }) => [
                    styles.actionPill,
                    {
                      backgroundColor: colors.accent,
                      opacity: pressed ? 0.85 : 1,
                      alignSelf: 'center',
                      marginTop: 12,
                    },
                  ]}
                >
                  <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.actionPillText}>Try again</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </Pressable>

        {/* Voice command hints for visually impaired users */}
        {assistantState === 'idle' ? (
          <Text
            style={[styles.voiceHints, { color: colors.textSecondary }]}
            accessibilityRole="text"
          >
            {t('home.voiceHints', {
              defaultValue:
                'Try saying: "Ask what does the Bible say about love", "Open favorites", "Open search", or "Repeat".',
            })}
          </Text>
        ) : null}

        {/* Daily Verse */}
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
          accessibilityRole="header"
        >
          {t('home.dailyVerse')}
        </Text>

        {dailyLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
        ) : dailyVerse ? (
          <Pressable
            onPress={handleDailyVersePress}
            accessibilityRole="button"
            accessibilityLabel={`${t('home.dailyVerse')}: ${dailyVerse.reference}. ${verseText}`}
            accessibilityHint="Double tap to view the full verse"
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
              {dailyVerse.reference}
            </Text>
            <Text
              style={[styles.verseText, { color: colors.text }]}
              numberOfLines={3}
            >
              {verseText}
            </Text>
            <View style={styles.verseArrow}>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Pressable>
        ) : (
          <Text style={[styles.noVerse, { color: colors.textSecondary }]}>
            {t('home.noDailyVerse', { defaultValue: 'No verse available' })}
          </Text>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            onPress={handleSearchPress}
            accessibilityRole="button"
            accessibilityLabel="Search the Bible"
            style={({ pressed }) => [
              styles.quickActionPill,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="search" size={20} color={colors.accent} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              {t('home.searchBible', { defaultValue: 'Search Bible' })}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleFavoritesPress}
            accessibilityRole="button"
            accessibilityLabel="Open favorites"
            style={({ pressed }) => [
              styles.quickActionPill,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="heart" size={20} color={colors.accent} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              {t('home.favorites', { defaultValue: 'Favorites' })}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Mini playback bar */}
      {isSpeaking && assistantState !== 'responded' ? (
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
            Playing…
          </Text>
          <IconButtonAccessible
            iconName="stop-circle"
            onPress={handleStopTTS}
            accessibilityLabel="Stop audio"
            color={colors.error}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '400',
    marginBottom: 20,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  heroAccentStrip: {
    height: 6,
    width: '100%',
  },
  heroContent: {
    padding: 28,
    alignItems: 'center',
  },
  micButton: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  statusText: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  questionBubble: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '400',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  answerContainer: {
    width: '100%',
  },
  answerBubble: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: 12,
  },
  answerScroll: {
    maxHeight: 220,
  },
  answerText: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 25,
  },
  responseActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    gap: 6,
    minHeight: MIN_TOUCH_SIZE,
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  voiceHints: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  dailyVerseCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    minHeight: MIN_TOUCH_SIZE,
    flexDirection: 'column',
  },
  verseReference: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  verseArrow: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  noVerse: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    minHeight: MIN_TOUCH_SIZE,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
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
