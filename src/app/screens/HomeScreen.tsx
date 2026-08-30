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
import { IconButtonAccessible } from '@/components/common/IconButtonAccessible';
import { Halo } from '@/components/common/Halo';
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
const MIC_SIZE = Math.min(SCREEN_W * 0.4, 180);

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

  // Animations
  const micScale = useRef(new Animated.Value(1)).current;
  const screenFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screenFade]);

  // Check AI health on mount
  useEffect(() => {
    checkAiHealth().then((h) => setAiHealthStatus(h.status));
  }, []);

  // Pulsing mic when listening
  useEffect(() => {
    if (assistantState === 'listening') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(micScale, {
            toValue: 1.06,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(micScale, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.timing(micScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [assistantState, micScale]);

  // Load daily verse from AI
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

  // Shake navigates to voice activation
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

        case 'repeatFrom': {
          if (parsed.args) {
            addMessage({ type: 'user', text: text });
            // Search for the verse and read from there
            void sendQuestionToAi(`Read the verse ${parsed.args} and the verses after it`);
          }
          return true;
        }

        case 'repeatVerse': {
          if (parsed.args) {
            addMessage({ type: 'user', text: text });
            void sendQuestionToAi(`Read verse ${parsed.args}`);
          }
          return true;
        }

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
          addMessage({ type: 'assistant', text: isTa ? `வேகம் குறைக்கப்பட்டது: ${newSpeed}x` : `Speed decreased to ${newSpeed}x` });
          setAssistantState('responded');
          return true;
        }

        case 'speedUp': {
          const store = useSettingsStore.getState();
          const newSpeed = Math.min(2.0, store.ttsSpeed + 0.25);
          store.setTtsSpeed(newSpeed);
          addMessage({ type: 'assistant', text: isTa ? `வேகம் அதிகரிக்கப்பட்டது: ${newSpeed}x` : `Speed increased to ${newSpeed}x` });
          setAssistantState('responded');
          return true;
        }

        case 'saveVerse':
        case 'bookmark': {
          // Find the last assistant message with verses
          const lastWithVerses = [...chatHistory].reverse().find(
            (m) => m.type === 'assistant' && m.verses && m.verses.length > 0,
          );
          if (lastWithVerses?.verses?.[0]) {
            const v = lastWithVerses.verses[0];
            addMessage({
              type: 'assistant',
              text: isTa
                ? `"${v.reference}" பிடித்தவையில் சேமிக்கப்பட்டது. பிடித்தவை பக்கத்தில் பாருங்கள்.`
                : `"${v.reference}" saved to favorites. Check the Favorites page.`,
            });
          } else {
            addMessage({
              type: 'assistant',
              text: isTa ? 'சேமிக்க வசனம் இல்லை. முதலில் ஒரு கேள்வி கேளுங்கள்.' : 'No verse to save. Ask a question first.',
            });
          }
          setAssistantState('responded');
          return true;
        }

        case 'listSaved':
        case 'openFavorites':
          addMessage({ type: 'assistant', text: isTa ? 'பிடித்தவை பக்கத்திற்கு செல்கிறேன்...' : 'Opening favorites...' });
          setAssistantState('responded');
          setTimeout(() => {
            (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate('Main', { screen: 'Favorites' });
          }, 300);
          return true;

        case 'readSaved':
          addMessage({ type: 'assistant', text: isTa ? 'சேமித்த வசனங்களை படிக்க பிடித்தவை பக்கத்திற்கு செல்கிறேன்...' : 'Going to favorites to read saved verses...' });
          setAssistantState('responded');
          setTimeout(() => {
            (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate('Main', { screen: 'Favorites' });
          }, 300);
          return true;

        case 'openHome':
          addMessage({ type: 'assistant', text: isTa ? 'முகப்பில் இருக்கிறோம்' : "You're already on the home screen." });
          setAssistantState('responded');
          return true;

        case 'openSettings':
          addMessage({ type: 'assistant', text: isTa ? 'அமைப்புகள் திறக்கிறேன்...' : 'Opening settings...' });
          setAssistantState('responded');
          setTimeout(() => {
            (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate('Main', { screen: 'Settings' });
          }, 300);
          return true;

        case 'openVoiceHelp':
        case 'help':
          addMessage({ type: 'assistant', text: isTa ? 'குரல் கட்டளைகள் பக்கம் திறக்கிறேன்...' : 'Opening voice commands...' });
          setAssistantState('responded');
          setTimeout(() => {
            navigation.navigate('VoiceCommands');
          }, 300);
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
            addMessage({
              type: 'assistant',
              text: `${dailyVerse.reference}\n\n${dvText}`,
            });
            void speakText(`${dailyVerse.reference}. ${dvText}`, recognitionLanguage);
          } else {
            addMessage({ type: 'assistant', text: isTa ? 'இன்றைய வசனம் கிடைக்கவில்லை' : 'Daily verse not available.' });
          }
          setAssistantState('responded');
          return true;

        case 'nextVerse':
        case 'previousVerse':
        case 'share':
        case 'recordReflection':
        case 'startMemorization':
        case 'read':
        case 'readContext':
          // These need VerseDetail screen context
          addMessage({
            type: 'assistant',
            text: isTa
              ? 'இந்த கட்டளை வசன விவரப் பக்கத்தில் மட்டுமே வேலை செய்யும்.'
              : 'This command works on the verse detail page. Tap a verse to open it first.',
          });
          setAssistantState('responded');
          return true;

        // For search-type commands, let them fall through to AI
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
        AccessibilityInfo.announceForAccessibility('Sorry, an error occurred');
      }
    },
    [recognitionLanguage, speakText, setLastAiAnswer, addMessage],
  );

  const sendQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) return;

      stopTTS();

      // Try voice command first
      if (handleVoiceCommand(question.trim())) return;

      // Not a command — send to AI
      addMessage({ type: 'user', text: question.trim() });
      await sendQuestionToAi(question.trim());
    },
    [stopTTS, handleVoiceCommand, addMessage, sendQuestionToAi],
  );

  // When transcript changes and we're in listening state, send to AI
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

  const handleFavoritesPress = useCallback(() => {
    (navigation as unknown as { navigate: (s: string, p: object) => void }).navigate(
      'Main',
      { screen: 'Favorites' },
    );
  }, [navigation]);

  const handleStopTTS = useCallback(() => {
    stopTTS();
  }, [stopTTS]);

  const handleSetEnglish = useCallback(() => {
    setRecognitionLanguage('en');
  }, [setRecognitionLanguage]);

  const handleSetTamil = useCallback(() => {
    setRecognitionLanguage('ta');
  }, [setRecognitionLanguage]);

  const handleClearChat = useCallback(() => {
    setChatHistory([]);
    setAssistantState('idle');
    stopTTS();
  }, [stopTTS]);

  const verseText = dailyVerse
    ? recognitionLanguage === 'ta'
      ? dailyVerse.tamilText || dailyVerse.englishText
      : dailyVerse.englishText || dailyVerse.tamilText
    : '';

  const displayTranscript =
    assistantState === 'listening'
      ? partialTranscript || transcript || ''
      : '';

  const micIconName: keyof typeof Ionicons.glyphMap =
    assistantState === 'listening' ? 'mic' : 'mic-outline';

  const healthDot =
    aiHealthStatus === 'ok'
      ? '#4ADE80'
      : aiHealthStatus === 'degraded'
        ? '#FBBF24'
        : aiHealthStatus === 'checking'
          ? colors.textSecondary
          : '#EF4444';

  const renderChatMessage = (msg: ChatMessage) => {
    if (msg.type === 'user') {
      return (
        <View
          key={msg.id}
          style={[
            styles.chatBubbleUser,
            { backgroundColor: colors.accent },
          ]}
          accessible={true}
          accessibilityLabel={`You asked: ${msg.text}`}
        >
          <Text style={[styles.chatBubbleText, { color: '#FFFFFF' }]}>
            {msg.text}
          </Text>
        </View>
      );
    }

    if (msg.type === 'error') {
      return (
        <View
          key={msg.id}
          style={[styles.chatBubbleAssistant, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: colors.error }]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={`Error: ${msg.text}`}
        >
          <Ionicons name="alert-circle" size={16} color={colors.error} style={{ marginBottom: 4 }} />
          <Text style={[styles.chatBubbleText, { color: '#FCA5A5' }]}>
            {msg.text}
          </Text>
          <Pressable
            onPress={() => {
              // Retry: find the last user message before this error
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
            <Ionicons name="refresh-outline" size={14} color="#1A0F3D" />
            <Text style={[styles.retryPillText, { color: '#1A0F3D' }]}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    // Assistant message
    const lang = msg.language ?? 'en';
    return (
      <View key={msg.id}>
        <View
          style={[
            styles.chatBubbleAssistant,
            {
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderColor: colors.gold,
            },
          ]}
          accessible={true}
          accessibilityLabel={`Answer: ${msg.text}`}
        >
          <Text
            style={[styles.chatBubbleText, { color: '#F5F1FF' }]}
            selectable={true}
          >
            {msg.text}
          </Text>
        </View>

        {/* Verses for this message */}
        {msg.verses && msg.verses.length > 0 ? (
          <View style={styles.chatVersesContainer}>
            {msg.verses.map((v, idx) => {
              const display =
                lang === 'ta'
                  ? v.tamilText || v.englishText
                  : v.englishText || v.tamilText;
              return (
                <View
                  key={`${msg.id}-${v.reference}-${idx}`}
                  style={[
                    styles.verseListCard,
                    {
                      backgroundColor: colors.cardElevated,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => handleVersePress(v.reference)}
                    accessibilityRole="button"
                    accessibilityLabel={`${v.reference}. ${display}`}
                    accessibilityHint="Double tap to open the verse"
                    style={({ pressed }) => [
                      styles.verseCardBody,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
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
                    {v.snippet ? (
                      <Text
                        style={[styles.verseSnippet, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {v.snippet}
                      </Text>
                    ) : null}
                  </Pressable>
                  <View style={styles.verseFavCorner}>
                    <FavoriteButton
                      reference={v.reference}
                      englishText={v.englishText}
                      tamilText={v.tamilText}
                      size={22}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={colors.backdropGradient as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {highContrastMode ? <Starfield count={20} color={colors.gold} /> : null}

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Animated.View style={{ flex: 1, opacity: screenFade }}>
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header row */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.appNameRow}>
                    <Text
                      style={[styles.appName, { color: colors.gold }]}
                      accessibilityRole="header"
                    >
                      Heavenly Push
                    </Text>
                    <View
                      style={[styles.healthDot, { backgroundColor: healthDot }]}
                      accessibilityLabel={`AI status: ${aiHealthStatus}`}
                    />
                  </View>
                  <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                    {getGreeting()}
                  </Text>
                </View>

                {/* Language pill */}
                <View
                  style={[
                    styles.langPill,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Voice language"
                >
                  <Pressable
                    onPress={handleSetEnglish}
                    accessibilityRole="radio"
                    accessibilityLabel="Speak and reply in English"
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
                          color: recognitionLanguage === 'en' ? '#FFFFFF' : colors.text,
                        },
                      ]}
                    >
                      EN
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleSetTamil}
                    accessibilityRole="radio"
                    accessibilityLabel="Speak and reply in Tamil"
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
                          color: recognitionLanguage === 'ta' ? '#FFFFFF' : colors.text,
                        },
                      ]}
                    >
                      {'\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Mic hero (compact when chat has messages) */}
              <Pressable
                onPress={handleMicPress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={
                  assistantState === 'listening'
                    ? 'Listening. Double tap to stop.'
                    : 'Tap to start voice input'
                }
                accessibilityState={{
                  busy: assistantState === 'processing',
                  selected: assistantState === 'listening',
                }}
                style={({ pressed }) => [
                  chatHistory.length > 0 ? styles.heroCardCompact : styles.heroCard,
                  {
                    borderColor:
                      assistantState === 'listening' ? colors.gold : colors.border,
                    shadowColor: colors.accent,
                    opacity: pressed ? 0.94 : 1,
                  },
                ]}
              >
                <LinearGradient
                  colors={
                    colors.heroGradient as unknown as readonly [string, string, ...string[]]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={[styles.heroAccentStrip, { backgroundColor: colors.gold }]}
                />
                <View style={chatHistory.length > 0 ? styles.heroContentCompact : styles.heroContent}>
                  <Halo
                    size={chatHistory.length > 0 ? MIC_SIZE * 0.6 : MIC_SIZE}
                    active={assistantState === 'listening'}
                    color={colors.gold}
                  >
                    <Animated.View
                      style={[
                        styles.micButton,
                        {
                          width: chatHistory.length > 0 ? MIC_SIZE * 0.6 : MIC_SIZE,
                          height: chatHistory.length > 0 ? MIC_SIZE * 0.6 : MIC_SIZE,
                          borderRadius: chatHistory.length > 0 ? (MIC_SIZE * 0.6) / 2 : MIC_SIZE / 2,
                          backgroundColor:
                            assistantState === 'listening'
                              ? colors.accentDark
                              : colors.accent,
                          shadowColor: colors.gold,
                          borderColor:
                            assistantState === 'listening'
                              ? colors.gold
                              : 'rgba(255,255,255,0.2)',
                          transform: [{ scale: micScale }],
                        },
                      ]}
                    >
                      {assistantState === 'processing' ? (
                        <ActivityIndicator size="large" color="#FFFFFF" />
                      ) : (
                        <Ionicons
                          name={micIconName}
                          size={(chatHistory.length > 0 ? MIC_SIZE * 0.6 : MIC_SIZE) * 0.45}
                          color="#FFFFFF"
                        />
                      )}
                    </Animated.View>
                  </Halo>

                  {/* Status text */}
                  {assistantState === 'idle' && chatHistory.length === 0 ? (
                    <Text style={[styles.statusText, { color: '#F5F1FF' }]}>
                      {t('home.tapToAsk', { defaultValue: 'Tap to ask or type below' })}
                    </Text>
                  ) : assistantState === 'listening' ? (
                    <Text
                      style={[styles.statusText, { color: '#F5F1FF' }]}
                      accessibilityLiveRegion="polite"
                    >
                      {t('home.listening', { defaultValue: 'Listening...' })}
                    </Text>
                  ) : assistantState === 'processing' ? (
                    <Text
                      style={[styles.statusText, { color: '#F5F1FF' }]}
                      accessibilityLiveRegion="polite"
                    >
                      {t('home.thinking', { defaultValue: 'Thinking...' })}
                    </Text>
                  ) : null}

                  {/* Partial transcript while listening */}
                  {displayTranscript ? (
                    <View
                      style={[
                        styles.questionBubble,
                        {
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          borderColor: 'rgba(255,255,255,0.18)',
                        },
                      ]}
                    >
                      <Text style={[styles.questionText, { color: '#F5F1FF' }]}>
                        {displayTranscript}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>

              {/* Voice hint (only on first use) */}
              {assistantState === 'idle' && chatHistory.length === 0 ? (
                <Text
                  style={[styles.voiceHints, { color: colors.textSecondary }]}
                  accessibilityRole="text"
                >
                  {t('home.voiceHints', {
                    defaultValue:
                      'Try saying or typing: "Verses about love", "Who is Samuel?", "What does the Bible say about hope?"',
                  })}
                </Text>
              ) : null}

              {/* Chat history */}
              {chatHistory.length > 0 ? (
                <View style={styles.chatSection}>
                  <View style={styles.chatHeaderRow}>
                    <Text
                      style={[styles.chatSectionTitle, { color: colors.gold }]}
                      accessibilityRole="header"
                    >
                      {t('home.conversation', { defaultValue: 'Conversation' })}
                    </Text>
                    <Pressable
                      onPress={handleClearChat}
                      accessibilityRole="button"
                      accessibilityLabel="Clear conversation"
                      style={({ pressed }) => [
                        styles.clearButton,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>
                        Clear
                      </Text>
                    </Pressable>
                  </View>
                  {chatHistory.map(renderChatMessage)}

                  {/* Processing indicator */}
                  {assistantState === 'processing' ? (
                    <View style={[styles.chatBubbleAssistant, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: colors.border }]}>
                      <View style={styles.typingIndicator}>
                        <ActivityIndicator size="small" color={colors.gold} />
                        <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                          {t('home.thinking', { defaultValue: 'Thinking...' })}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Daily Verse */}
              <Text
                style={[styles.sectionTitle, { color: colors.gold }]}
                accessibilityRole="header"
              >
                {t('home.dailyVerse')}
              </Text>

              {dailyLoading ? (
                <ActivityIndicator
                  color={colors.accent}
                  style={{ marginVertical: 16 }}
                />
              ) : dailyVerse ? (
                <View
                  style={[
                    styles.dailyVerseCard,
                    {
                      backgroundColor: colors.cardElevated,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Pressable
                    onPress={handleDailyVersePress}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('home.dailyVerse')}: ${dailyVerse.reference}. ${verseText}`}
                    accessibilityHint="Double tap to view the full verse"
                    style={({ pressed }) => [
                      styles.dailyVerseBody,
                      { opacity: pressed ? 0.88 : 1 },
                    ]}
                  >
                    <Text style={[styles.verseReference, { color: colors.gold }]}>
                      {dailyVerse.reference}
                    </Text>
                    <Text
                      style={[styles.verseText, { color: colors.text }]}
                      numberOfLines={3}
                    >
                      {verseText}
                    </Text>
                    <View style={styles.verseArrow}>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                  </Pressable>
                  <View style={styles.verseFavCorner}>
                    <FavoriteButton
                      reference={dailyVerse.reference}
                      englishText={dailyVerse.englishText}
                      tamilText={dailyVerse.tamilText}
                      size={24}
                    />
                  </View>
                </View>
              ) : (
                <Text style={[styles.noVerse, { color: colors.textSecondary }]}>
                  {t('home.noDailyVerse', { defaultValue: 'No verse available' })}
                </Text>
              )}

              {/* Quick actions */}
              <View style={styles.quickActions}>
                <Pressable
                  onPress={handleFavoritesPress}
                  accessibilityRole="button"
                  accessibilityLabel="Open favorites"
                  style={({ pressed }) => [
                    styles.quickActionPill,
                    {
                      backgroundColor: colors.cardElevated,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons name="heart" size={20} color={colors.gold} />
                  <Text style={[styles.quickActionText, { color: colors.text }]}>
                    {t('home.favorites', { defaultValue: 'Favorites' })}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => navigation.navigate('VoiceCommands')}
                  accessibilityRole="button"
                  accessibilityLabel={recognitionLanguage === 'ta' ? 'குரல் கட்டளைகள்' : 'Voice Commands'}
                  style={({ pressed }) => [
                    styles.quickActionPill,
                    {
                      backgroundColor: colors.cardElevated,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Ionicons name="mic-circle-outline" size={20} color={colors.gold} />
                  <Text style={[styles.quickActionText, { color: colors.text }]}>
                    {recognitionLanguage === 'ta' ? 'கட்டளைகள்' : 'Commands'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            {/* Text input bar — always visible at bottom */}
            <View
              style={[
                styles.inputBar,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                value={textInput}
                onChangeText={setTextInput}
                placeholder={t('home.typeQuestion', {
                  defaultValue: 'Type a question...',
                })}
                placeholderTextColor={colors.placeholder}
                editable={assistantState !== 'processing'}
                returnKeyType="send"
                onSubmitEditing={handleTextSubmit}
                accessibilityLabel="Type your question"
                accessibilityHint="Type a question and press send"
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
                    backgroundColor:
                      textInput.trim() && assistantState !== 'processing'
                        ? colors.gold
                        : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={textInput.trim() ? '#1A0F3D' : colors.textSecondary}
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
                  size={20}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Mini playback bar */}
      {isSpeaking ? (
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
            Playing...
          </Text>
          <IconButtonAccessible
            iconName="stop-circle"
            onPress={handleStopTTS}
            accessibilityLabel="Stop audio"
            color={colors.error}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 16,
    gap: 12,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '400',
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
    fontSize: 14,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  heroCardCompact: {
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroAccentStrip: {
    height: 3,
    width: '100%',
    opacity: 0.85,
  },
  heroContent: {
    padding: 28,
    alignItems: 'center',
  },
  heroContentCompact: {
    padding: 16,
    alignItems: 'center',
  },
  micButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  questionBubble: {
    width: '100%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '400',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  voiceHints: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
    paddingHorizontal: 8,
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
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    padding: 14,
    borderRadius: 18,
    borderBottomRightRadius: 4,
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
    fontSize: 16,
    lineHeight: 23,
  },
  chatVersesContainer: {
    marginLeft: 8,
    marginBottom: 10,
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
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: 0.3,
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
    padding: 18,
    paddingRight: 56,
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
    paddingRight: 48,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  verseSnippet: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    fontStyle: 'italic',
  },
  verseFavCorner: {
    position: 'absolute',
    top: 6,
    right: 6,
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
    fontSize: 15,
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
    fontSize: 16,
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
