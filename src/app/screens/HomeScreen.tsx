import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  AccessibilityInfo,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useShakeDetector } from '@/hooks/useShakeDetector';
import { useTTS } from '@/hooks/useTTS';
import { useVoiceController } from '@/hooks/useVoiceController';
import { useVoiceStore } from '@/stores/useVoiceStore';
import { usePlaybackStore } from '@/stores/usePlaybackStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
  askAnything,
  checkAiHealth,
  getAiDailyVerse,
  type AiDailyVerseResponse,
  type AskVerse,
} from '@/services/ai/AiBibleService';
import { AngelAvatar } from '@/components/common/AngelAvatar';
import { GlassCard } from '@/components/common/GlassCard';
import { Starfield } from '@/components/common/Starfield';
import { FavoriteButton } from '@/components/verse/FavoriteButton';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import { voiceCommandParser } from '@/services/speech/VoiceCommandParser';
import { ttsService } from '@/services/audio/TTSService';
import type { RootStackParamList } from '@/types/navigation';

type HomeNav = NativeStackNavigationProp<RootStackParamList>;

type AssistantState = 'idle' | 'listening' | 'processing' | 'responded' | 'error';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'error';
  text: string;
  verses?: AskVerse[];
  language?: 'en' | 'ta';
  timestamp: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const { width: SCREEN_W } = Dimensions.get('window');
const ANGEL_SIZE = Math.min(SCREEN_W * 0.45, 200);

export function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const navigation = useNavigation<HomeNav>();
  const { speakText, stop: stopTTS, isSpeaking } = useTTS();
  const { startListening, stopListening, isListening } = useVoiceController();

  const recognitionLanguage = useVoiceStore((s) => s.recognitionLanguage);
  const setRecognitionLanguage = useVoiceStore((s) => s.setRecognitionLanguage);
  const transcript = useVoiceStore((s) => s.transcript);
  const partialTranscript = useVoiceStore((s) => s.partialTranscript);
  const setLastAiAnswer = usePlaybackStore((s) => s.setLastAiAnswer);
  const highContrastMode = useSettingsStore((s) => s.highContrastMode);

  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [textInput, setTextInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [dailyVerse, setDailyVerse] = useState<AiDailyVerseResponse | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [aiHealthStatus, setAiHealthStatus] = useState<'ok' | 'degraded' | 'error' | 'checking'>('checking');

  const prevTranscriptRef = useRef('');
  const scrollViewRef = useRef<ScrollView>(null);
  const msgIdRef = useRef(0);
  const screenFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screenFade]);

  useEffect(() => {
    checkAiHealth().then((h) => setAiHealthStatus(h.status));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setDailyLoading(true);
    getAiDailyVerse(recognitionLanguage)
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
  }, [recognitionLanguage]);

  useShakeDetector(() => {
    if (!isListening) {
      void handleMicPress();
    }
  });

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: String(++msgIdRef.current),
      timestamp: Date.now(),
    };
    setChatHistory((prev) => [...prev, newMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    return newMsg;
  }, []);

  const handleVoiceCommand = useCallback(
    (text: string): boolean => {
      const parsed = voiceCommandParser.parse(text);
      if (!parsed) return false;

      const isTa = recognitionLanguage === 'ta';

      switch (parsed.command) {
        case 'repeat': {
          const state = usePlaybackStore.getState();
          const answer = state.lastAiAnswer;
          const lang = state.lastAiLanguage ?? recognitionLanguage;
          if (answer) {
            addMessage({ type: 'assistant', text: isTa ? 'மீண்டும் படிக்கிறேன்...' : 'Repeating...' });
            void speakText(answer, lang);
          } else {
            addMessage({ type: 'assistant', text: isTa ? 'மீண்டும் படிக்க எதுவும் இல்லை' : 'Nothing to repeat yet.' });
          }
          setAssistantState('responded');
          return true;
        }

        case 'repeatFrom':
          if (parsed.args) {
            addMessage({ type: 'user', text: text });
            void sendQuestionToAi(`Read the verse ${parsed.args} and the verses after it`);
          }
          return true;

        case 'repeatVerse':
          if (parsed.args) {
            addMessage({ type: 'user', text: text });
            void sendQuestionToAi(`Read verse ${parsed.args}`);
          }
          return true;

        case 'stop':
          stopTTS();
          void ttsService.stop();
          addMessage({ type: 'assistant', text: isTa ? 'நிறுத்தப்பட்டது' : 'Stopped.' });
          setAssistantState('responded');
          return true;

        case 'slowDown': {
          const store = useSettingsStore.getState();
          const newSpeed = Math.max(0.5, store.ttsSpeed - 0.25);
          store.setTtsSpeed(newSpeed);
          addMessage({ type: 'assistant', text: isTa ? `வேகம்: ${newSpeed}x` : `Speed: ${newSpeed}x` });
          setAssistantState('responded');
          return true;
        }

        case 'speedUp': {
          const store = useSettingsStore.getState();
          const newSpeed = Math.min(2.0, store.ttsSpeed + 0.25);
          store.setTtsSpeed(newSpeed);
          addMessage({ type: 'assistant', text: isTa ? `வேகம்: ${newSpeed}x` : `Speed: ${newSpeed}x` });
          setAssistantState('responded');
          return true;
        }

        case 'saveVerse':
        case 'bookmark': {
          const lastWithVerses = [...chatHistory].reverse().find(
            (m) => m.type === 'assistant' && m.verses && m.verses.length > 0,
          );
          if (lastWithVerses?.verses?.[0]) {
            const v = lastWithVerses.verses[0];
            addMessage({
              type: 'assistant',
              text: isTa
                ? `"${v.reference}" சேமிக்கப்பட்டது`
                : `"${v.reference}" saved to favorites`,
            });
          } else {
            addMessage({
              type: 'assistant',
              text: isTa ? 'சேமிக்க வசனம் இல்லை' : 'No verse to save. Ask a question first.',
            });
          }
          setAssistantState('responded');
          return true;
        }

        case 'listSaved':
        case 'openFavorites':
          (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate('Main', { screen: 'Favorites' });
          return true;

        case 'readSaved':
          (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate('Main', { screen: 'Favorites' });
          return true;

        case 'openHome':
          return true;

        case 'openSettings':
          (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate('Main', { screen: 'Settings' });
          return true;

        case 'openVoiceHelp':
        case 'help':
          navigation.navigate('VoiceCommands');
          return true;

        case 'speakEnglish':
          setRecognitionLanguage('en');
          addMessage({ type: 'assistant', text: 'Switched to English.' });
          setAssistantState('responded');
          return true;

        case 'speakTamil':
          setRecognitionLanguage('ta');
          addMessage({ type: 'assistant', text: 'தமிழுக்கு மாற்றப்பட்டது.' });
          setAssistantState('responded');
          return true;

        case 'dailyVerse':
          if (dailyVerse) {
            const dvText = recognitionLanguage === 'ta'
              ? dailyVerse.tamilText || dailyVerse.englishText
              : dailyVerse.englishText || dailyVerse.tamilText;
            addMessage({ type: 'assistant', text: `${dailyVerse.reference}\n\n${dvText}` });
            void speakText(`${dailyVerse.reference}. ${dvText}`, recognitionLanguage);
          }
          setAssistantState('responded');
          return true;

        case 'ask':
        case 'search':
        case 'searchInTamil':
        case 'searchInEnglish':
          if (parsed.args) {
            addMessage({ type: 'user', text: text });
            void sendQuestionToAi(parsed.args);
            return true;
          }
          return false;

        default:
          return false;
      }
    },
    [recognitionLanguage, speakText, stopTTS, addMessage, chatHistory, navigation, dailyVerse, setRecognitionLanguage],
  );

  const sendQuestionToAi = useCallback(
    async (question: string) => {
      setAssistantState('processing');
      AccessibilityInfo.announceForAccessibility('Processing your question');

      try {
        const response = await askAnything(question.trim(), recognitionLanguage);
        addMessage({
          type: 'assistant',
          text: response.answer,
          verses: response.verses ?? [],
          language: response.detectedLanguage,
        });
        setAssistantState('responded');
        setLastAiAnswer(response.answer, response.detectedLanguage);
        AccessibilityInfo.announceForAccessibility(
          `Here is the answer: ${response.answer.slice(0, 200)}`,
        );
        void speakText(response.answer, response.detectedLanguage);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        addMessage({ type: 'error', text: message });
        setAssistantState('error');
      }
    },
    [recognitionLanguage, speakText, setLastAiAnswer, addMessage],
  );

  const sendQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) return;
      stopTTS();
      if (handleVoiceCommand(question.trim())) return;
      addMessage({ type: 'user', text: question.trim() });
      await sendQuestionToAi(question.trim());
    },
    [stopTTS, handleVoiceCommand, addMessage, sendQuestionToAi],
  );

  useEffect(() => {
    if (
      transcript &&
      transcript !== prevTranscriptRef.current &&
      assistantState === 'listening'
    ) {
      prevTranscriptRef.current = transcript;
      void sendQuestion(transcript);
    }
  }, [transcript, assistantState, sendQuestion]);

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

  const handleMicPress = useCallback(async () => {
    if (isListening) {
      await stopListening();
      return;
    }
    stopTTS();
    setTextInput('');
    prevTranscriptRef.current = '';
    setAssistantState('listening');
    AccessibilityInfo.announceForAccessibility('Listening. Speak now.');
    await startListening();
  }, [isListening, startListening, stopListening, stopTTS]);

  const handleTextSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    const q = textInput;
    setTextInput('');
    void sendQuestion(q);
  }, [textInput, sendQuestion]);

  const handleDailyVersePress = useCallback(() => {
    if (dailyVerse?.reference) {
      navigation.navigate('VerseDetail', { reference: dailyVerse.reference });
    }
  }, [dailyVerse, navigation]);

  const handleVersePress = useCallback(
    (reference: string) => {
      navigation.navigate('VerseDetail', { reference });
    },
    [navigation],
  );

  const handleClearChat = useCallback(() => {
    setChatHistory([]);
    setAssistantState('idle');
    stopTTS();
  }, [stopTTS]);

  // Derive angel state from assistant state + TTS
  const angelState = isSpeaking
    ? 'speaking' as const
    : assistantState === 'listening'
      ? 'listening' as const
      : assistantState === 'processing'
        ? 'processing' as const
        : 'idle' as const;

  const verseText = dailyVerse
    ? recognitionLanguage === 'ta'
      ? dailyVerse.tamilText || dailyVerse.englishText
      : dailyVerse.englishText || dailyVerse.tamilText
    : '';

  const displayTranscript =
    assistantState === 'listening'
      ? partialTranscript || transcript || ''
      : '';

  const healthDot =
    aiHealthStatus === 'ok'
      ? '#34D399'
      : aiHealthStatus === 'degraded'
        ? '#FBBF24'
        : aiHealthStatus === 'checking'
          ? colors.textSecondary
          : '#FB7185';

  const hasChat = chatHistory.length > 0;

  const renderChatMessage = (msg: ChatMessage) => {
    if (msg.type === 'user') {
      return (
        <View
          key={msg.id}
          style={[styles.chatBubbleUser, { backgroundColor: colors.chatUser, borderColor: colors.glassBorder }]}
          accessible={true}
          accessibilityLabel={`You asked: ${msg.text}`}
        >
          <Text style={[styles.chatBubbleText, { color: colors.text }]}>
            {msg.text}
          </Text>
        </View>
      );
    }

    if (msg.type === 'error') {
      return (
        <View
          key={msg.id}
          style={[styles.chatBubbleAssistant, { backgroundColor: 'rgba(251,113,133,0.08)', borderColor: 'rgba(251,113,133,0.2)' }]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={`Error: ${msg.text}`}
        >
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={[styles.chatBubbleText, { color: '#FCA5A5', flex: 1 }]}>
              {msg.text}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              const idx = chatHistory.findIndex((m) => m.id === msg.id);
              for (let i = idx - 1; i >= 0; i--) {
                if (chatHistory[i].type === 'user') {
                  void sendQuestion(chatHistory[i].text);
                  return;
                }
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            style={({ pressed }) => [
              styles.retryPill,
              { backgroundColor: colors.gold, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="refresh-outline" size={14} color="#05030E" />
            <Text style={[styles.retryPillText, { color: '#05030E' }]}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    // Assistant message
    const lang = msg.language ?? 'en';
    return (
      <View key={msg.id}>
        <View
          style={[styles.chatBubbleAssistant, { backgroundColor: colors.chatAssistant, borderColor: colors.glassBorder }]}
          accessible={true}
          accessibilityLabel={`Answer: ${msg.text}`}
        >
          <Text
            style={[styles.chatBubbleText, { color: colors.text }]}
            selectable={true}
          >
            {msg.text}
          </Text>
        </View>

        {msg.verses && msg.verses.length > 0 ? (
          <View style={styles.chatVersesContainer}>
            {msg.verses.map((v, idx) => {
              const display =
                lang === 'ta'
                  ? v.tamilText || v.englishText
                  : v.englishText || v.tamilText;
              return (
                <Pressable
                  key={`${msg.id}-${v.reference}-${idx}`}
                  onPress={() => handleVersePress(v.reference)}
                  accessibilityRole="button"
                  accessibilityLabel={`${v.reference}. ${display}`}
                  style={({ pressed }) => [
                    styles.verseListCard,
                    {
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View style={styles.verseCardBody}>
                    <Text style={[styles.verseReference, { color: colors.gold }]}>
                      {v.reference}
                    </Text>
                    {display ? (
                      <Text
                        style={[styles.verseText, { color: colors.text }]}
                        numberOfLines={3}
                      >
                        {display}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.verseFavCorner}>
                    <FavoriteButton
                      reference={v.reference}
                      englishText={v.englishText}
                      tamilText={v.tamilText}
                      size={20}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backdropGradient as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Starfield count={24} color={colors.gold} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Animated.View style={{ flex: 1, opacity: screenFade }}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.appNameRow}>
                    <Text
                      style={[styles.appName, { color: colors.gold }]}
                      accessibilityRole="header"
                    >
                      Heavenly Push
                    </Text>
                    <View style={[styles.healthDot, { backgroundColor: healthDot }]} />
                  </View>
                  <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                    {getGreeting()}
                  </Text>
                </View>

                {/* Language pill */}
                <View
                  style={[styles.langPill, { borderColor: colors.glassBorder, backgroundColor: colors.glass }]}
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Voice language"
                >
                  <Pressable
                    onPress={() => setRecognitionLanguage('en')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: recognitionLanguage === 'en' }}
                    style={[
                      styles.langPillButton,
                      {
                        backgroundColor:
                          recognitionLanguage === 'en' ? colors.accentDark : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.langPillText,
                        {
                          color: recognitionLanguage === 'en' ? '#FFFFFF' : colors.textSecondary,
                        },
                      ]}
                    >
                      EN
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setRecognitionLanguage('ta')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: recognitionLanguage === 'ta' }}
                    style={[
                      styles.langPillButton,
                      {
                        backgroundColor:
                          recognitionLanguage === 'ta' ? colors.accentDark : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.langPillText,
                        {
                          color: recognitionLanguage === 'ta' ? '#FFFFFF' : colors.textSecondary,
                        },
                      ]}
                    >
                      {'\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Angel Hero */}
              <Pressable
                onPress={handleMicPress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={
                  assistantState === 'listening'
                    ? 'Listening. Double tap to stop.'
                    : 'Tap the angel to start voice input'
                }
                accessibilityState={{
                  busy: assistantState === 'processing',
                  selected: assistantState === 'listening',
                }}
                style={styles.angelContainer}
              >
                <AngelAvatar
                  state={angelState}
                  size={hasChat ? ANGEL_SIZE * 0.65 : ANGEL_SIZE}
                  glowColor={colors.angelGlow}
                  accentColor={colors.gold}
                />

                {/* Status text below angel */}
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {assistantState === 'idle' && !hasChat
                    ? t('home.tapToAsk', { defaultValue: 'Tap the angel to ask' })
                    : assistantState === 'listening'
                      ? t('home.listening', { defaultValue: 'I\'m listening...' })
                      : assistantState === 'processing'
                        ? t('home.thinking', { defaultValue: 'Let me think...' })
                        : isSpeaking
                          ? t('home.speaking', { defaultValue: 'Speaking...' })
                          : ''}
                </Text>

                {/* Partial transcript */}
                {displayTranscript ? (
                  <View style={[styles.transcriptBubble, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                    <Text style={[styles.transcriptText, { color: colors.text }]}>
                      "{displayTranscript}"
                    </Text>
                  </View>
                ) : null}
              </Pressable>

              {/* Voice hints (first visit only) */}
              {assistantState === 'idle' && !hasChat ? (
                <Text style={[styles.voiceHints, { color: colors.textSecondary }]}>
                  {t('home.voiceHints', {
                    defaultValue:
                      'Try: "Verses about love", "Who is Samuel?", "What does the Bible say about hope?"',
                  })}
                </Text>
              ) : null}

              {/* Chat History */}
              {hasChat ? (
                <View style={styles.chatSection}>
                  <View style={styles.chatHeaderRow}>
                    <Text style={[styles.chatSectionTitle, { color: colors.gold }]} accessibilityRole="header">
                      {t('home.conversation', { defaultValue: 'Conversation' })}
                    </Text>
                    <Pressable
                      onPress={handleClearChat}
                      accessibilityRole="button"
                      accessibilityLabel="Clear conversation"
                      style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.6 : 1 }]}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                  {chatHistory.map(renderChatMessage)}

                  {assistantState === 'processing' ? (
                    <View style={[styles.chatBubbleAssistant, { backgroundColor: colors.chatAssistant, borderColor: colors.glassBorder }]}>
                      <View style={styles.typingIndicator}>
                        <ActivityIndicator size="small" color={colors.gold} />
                        <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                          {t('home.thinking', { defaultValue: 'Let me think...' })}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Daily Verse */}
              <Text style={[styles.sectionTitle, { color: colors.gold }]} accessibilityRole="header">
                {t('home.dailyVerse')}
              </Text>

              {dailyLoading ? (
                <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
              ) : dailyVerse ? (
                <Pressable
                  onPress={handleDailyVersePress}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('home.dailyVerse')}: ${dailyVerse.reference}. ${verseText}`}
                  style={({ pressed }) => [
                    styles.dailyVerseCard,
                    {
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  <View style={styles.dailyVerseBody}>
                    <Text style={[styles.verseReference, { color: colors.gold }]}>
                      {dailyVerse.reference}
                    </Text>
                    <Text style={[styles.verseText, { color: colors.text }]} numberOfLines={3}>
                      {verseText}
                    </Text>
                    <View style={styles.verseArrow}>
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </View>
                  </View>
                  <View style={styles.verseFavCorner}>
                    <FavoriteButton
                      reference={dailyVerse.reference}
                      englishText={dailyVerse.englishText}
                      tamilText={dailyVerse.tamilText}
                      size={22}
                    />
                  </View>
                </Pressable>
              ) : (
                <Text style={[styles.noVerse, { color: colors.textSecondary }]}>
                  {t('home.noDailyVerse', { defaultValue: 'No verse available' })}
                </Text>
              )}

              {/* Quick actions */}
              <View style={styles.quickActions}>
                <Pressable
                  onPress={() => (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate('Main', { screen: 'Favorites' })}
                  accessibilityRole="button"
                  accessibilityLabel="Favorites"
                  style={({ pressed }) => [
                    styles.quickActionPill,
                    { backgroundColor: colors.glass, borderColor: colors.glassBorder, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="heart" size={18} color={colors.gold} />
                  <Text style={[styles.quickActionText, { color: colors.text }]}>
                    {t('home.favorites', { defaultValue: 'Favorites' })}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('VoiceCommands')}
                  accessibilityRole="button"
                  accessibilityLabel="Voice Commands"
                  style={({ pressed }) => [
                    styles.quickActionPill,
                    { backgroundColor: colors.glass, borderColor: colors.glassBorder, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="mic-circle-outline" size={18} color={colors.gold} />
                  <Text style={[styles.quickActionText, { color: colors.text }]}>
                    {recognitionLanguage === 'ta' ? 'கட்டளைகள்' : 'Commands'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            {/* Input bar */}
            <View style={[styles.inputBar, { backgroundColor: colors.tabBar, borderColor: colors.glassBorder }]}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.glassBorder,
                  },
                ]}
                value={textInput}
                onChangeText={setTextInput}
                placeholder={t('home.typeQuestion', { defaultValue: 'Type a question...' })}
                placeholderTextColor={colors.placeholder}
                editable={assistantState !== 'processing'}
                returnKeyType="send"
                onSubmitEditing={handleTextSubmit}
                accessibilityLabel="Type your question"
                blurOnSubmit={false}
              />
              <Pressable
                onPress={handleTextSubmit}
                disabled={!textInput.trim() || assistantState === 'processing'}
                accessibilityRole="button"
                accessibilityLabel="Send question"
                style={({ pressed }) => [
                  styles.sendButton,
                  {
                    backgroundColor: textInput.trim() ? colors.gold : colors.glass,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={textInput.trim() ? '#05030E' : colors.textSecondary}
                />
              </Pressable>
              <Pressable
                onPress={handleMicPress}
                accessibilityRole="button"
                accessibilityLabel={isListening ? 'Stop listening' : 'Voice input'}
                style={({ pressed }) => [
                  styles.sendButton,
                  {
                    backgroundColor: isListening ? colors.error : colors.accent,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={isListening ? 'mic-off' : 'mic'}
                  size={18}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Mini playback bar */}
      {isSpeaking ? (
        <View style={[styles.miniBar, { backgroundColor: colors.tabBar, borderColor: colors.glassBorder }]}>
          <View style={styles.miniBarContent}>
            <View style={[styles.speakingDot, { backgroundColor: colors.gold }]} />
            <Text style={[styles.miniBarText, { color: colors.text }]} numberOfLines={1}>
              Speaking...
            </Text>
          </View>
          <Pressable
            onPress={stopTTS}
            accessibilityRole="button"
            accessibilityLabel="Stop audio"
            style={({ pressed }) => [
              styles.stopButton,
              { backgroundColor: 'rgba(251,113,133,0.15)', opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="stop" size={16} color={colors.error} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  healthDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 2,
  },
  langPill: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  },
  langPillButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 48,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  angelContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusText: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  transcriptBubble: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: '85%',
  },
  transcriptText: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  voiceHints: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  chatSection: {
    marginBottom: 20,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chatSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  clearButton: {
    padding: 8,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    marginBottom: 10,
  },
  chatBubbleAssistant: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    padding: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    marginBottom: 6,
  },
  chatBubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  chatVersesContainer: {
    marginLeft: 8,
    marginBottom: 10,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
  },
  retryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
    marginTop: 8,
  },
  retryPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  dailyVerseCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    minHeight: MIN_TOUCH_SIZE,
    overflow: 'hidden',
    position: 'relative',
  },
  dailyVerseBody: {
    padding: 16,
    paddingRight: 48,
  },
  verseListCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: MIN_TOUCH_SIZE,
    overflow: 'hidden',
    position: 'relative',
  },
  verseCardBody: {
    padding: 14,
    paddingRight: 44,
  },
  verseReference: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  verseText: {
    fontSize: 14,
    lineHeight: 20,
  },
  verseFavCorner: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  verseArrow: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  noVerse: {
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
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
    fontSize: 14,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: MIN_TOUCH_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  miniBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  speakingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  miniBarText: {
    fontSize: 15,
    fontWeight: '500',
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
