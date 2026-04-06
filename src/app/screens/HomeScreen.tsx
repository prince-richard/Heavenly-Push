import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  AccessibilityInfo,
  ActivityIndicator,
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
import { useVoiceController } from '@/hooks/useVoiceController';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useVoiceStore } from '@/stores/useVoiceStore';
import { usePlaybackStore } from '@/stores/usePlaybackStore';
import { chatWithBible } from '@/services/ai/AiBibleService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
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

export function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const navigation = useNavigation<HomeNav>();
  const { verse, loading: dailyLoading } = useDailyVerse();
  const { speakText, stop: stopTTS, isSpeaking } = useTTS();
  const { startListening, stopListening, isListening } = useVoiceController();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const transcript = useVoiceStore((s) => s.transcript);
  const partialTranscript = useVoiceStore((s) => s.partialTranscript);
  const speakingStatus = usePlaybackStore((s) => s.speakingStatus);

  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiError, setAiError] = useState('');
  const prevTranscriptRef = useRef('');

  // Shake navigates to Search tab with voice activated
  useShakeDetector(() => {
    (navigation as unknown as { navigate: (screen: string, params: object) => void }).navigate('Main', {
      screen: 'Search',
      params: { voiceActivated: true },
    });
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
          AccessibilityInfo.announceForAccessibility(
            `Here is the answer: ${response.answer.slice(0, 200)}`
          );
          // Auto-speak the response
          void speakText(response.answer, primaryLanguage);
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Something went wrong';
          setAiError(message);
          setAssistantState('error');
          AccessibilityInfo.announceForAccessibility('Sorry, an error occurred');
        });
    }
  }, [transcript, assistantState, primaryLanguage, speakText]);

  // Sync listening state
  useEffect(() => {
    if (!isListening && assistantState === 'listening') {
      // Voice recognition ended — if we have no transcript yet, go back to idle
      if (!transcript || transcript === prevTranscriptRef.current) {
        // Small delay to allow final transcript to arrive
        const timer = setTimeout(() => {
          if (assistantState === 'listening') {
            setAssistantState('idle');
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isListening, assistantState, transcript]);

  const handleMicPress = useCallback(async () => {
    if (isListening) {
      await stopListening();
      return;
    }

    // Reset state for new question
    stopTTS();
    setAiAnswer('');
    setAiError('');
    setUserQuestion('');
    prevTranscriptRef.current = '';
    setAssistantState('listening');
    AccessibilityInfo.announceForAccessibility('Listening');

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
    if (verse) {
      navigation.navigate('VerseDetail', { verseId: verse.id });
    }
  }, [verse, navigation]);

  const handleSearchPress = useCallback(() => {
    (navigation as unknown as { navigate: (screen: string, params: object) => void }).navigate('Main', {
      screen: 'Search',
    });
  }, [navigation]);

  const handleFavoritesPress = useCallback(() => {
    (navigation as unknown as { navigate: (screen: string, params: object) => void }).navigate('Main', {
      screen: 'Favorites',
    });
  }, [navigation]);

  const handleStopTTS = useCallback(() => {
    stopTTS();
  }, [stopTTS]);

  const verseText = verse
    ? primaryLanguage === 'ta'
      ? verse.textTa ?? verse.textEn ?? ''
      : verse.textEn ?? verse.textTa ?? ''
    : '';

  const verseReference = verse
    ? `${primaryLanguage === 'ta' ? verse.bookNameTa : verse.bookNameEn} ${verse.chapter}:${verse.verse}`
    : '';

  const displayTranscript =
    assistantState === 'listening'
      ? partialTranscript || transcript || ''
      : userQuestion;

  const micIconName: keyof typeof Ionicons.glyphMap =
    assistantState === 'listening' ? 'mic' : 'mic-outline';

  const statusText = (() => {
    switch (assistantState) {
      case 'idle':
        return t('home.askBible', { defaultValue: 'Tap to ask about the Bible' });
      case 'listening':
        return t('home.listening', { defaultValue: 'Listening...' });
      case 'processing':
        return t('home.thinking', { defaultValue: 'Thinking...' });
      case 'responded':
        return '';
      case 'error':
        return '';
    }
  })();

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

        {/* AI Voice Assistant Card (Hero) */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.cardElevated,
              borderColor: colors.border,
              shadowColor: colors.accent,
            },
          ]}
          accessible={true}
          accessibilityLabel="Bible voice assistant"
        >
          {/* Accent strip at top of card */}
          <View
            style={[styles.heroAccentStrip, { backgroundColor: colors.accent }]}
          />

          <View style={styles.heroContent}>
            {/* Mic Button */}
            <Pressable
              onPress={handleMicPress}
              accessibilityRole="button"
              accessibilityLabel={
                assistantState === 'listening'
                  ? 'Stop listening. Double tap to stop'
                  : 'Ask the Bible assistant. Double tap to start listening'
              }
              accessibilityState={{ busy: assistantState === 'processing' }}
              style={({ pressed }) => [
                styles.micButton,
                {
                  backgroundColor:
                    assistantState === 'listening'
                      ? colors.accentDark
                      : colors.accent,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: colors.accent,
                },
              ]}
            >
              {assistantState === 'processing' ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <Ionicons name={micIconName} size={40} color="#FFFFFF" />
              )}
            </Pressable>

            {/* Status Text */}
            {statusText ? (
              <Text
                style={[styles.statusText, { color: colors.textSecondary }]}
                accessibilityLiveRegion="polite"
              >
                {statusText}
              </Text>
            ) : null}

            {/* User Question */}
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

            {/* AI Response */}
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

            {/* Error State */}
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
        </View>

        {/* Daily Verse Card */}
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
          accessibilityRole="header"
        >
          {t('home.dailyVerse')}
        </Text>

        {dailyLoading ? (
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
            {t('home.noDailyVerse')}
          </Text>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable
            onPress={handleSearchPress}
            accessibilityRole="button"
            accessibilityLabel="Search Bible"
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
            accessibilityLabel="Favorites"
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
      {speakingStatus !== 'idle' && assistantState !== 'responded' && (
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
            onPress={handleStopTTS}
            accessibilityLabel="Stop audio"
            color={colors.error}
          />
        </View>
      )}
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
    marginBottom: 24,
  },
  // Hero AI Card
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 28,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  heroAccentStrip: {
    height: 4,
    width: '100%',
  },
  heroContent: {
    padding: 24,
    alignItems: 'center',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '400',
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
    fontSize: 16,
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
    maxHeight: 200,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  responseActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    minHeight: MIN_TOUCH_SIZE,
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Section
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  // Daily Verse
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
  // Quick Actions
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
  // Mini Bar
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
