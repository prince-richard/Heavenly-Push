import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  AccessibilityInfo,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { speechService } from '@/services/speech/SpeechService';
import { ttsService } from '@/services/audio/TTSService';
import { voiceCommandParser } from '@/services/speech/VoiceCommandParser';
import { useVoiceStore } from '@/stores/useVoiceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePlaybackStore } from '@/stores/usePlaybackStore';
import { useSearchStore } from '@/stores/useSearchStore';
import { navigateToTab, navigateToVoiceCommands } from '@/app/navigation/navigationRef';
import { askAnything } from '@/services/ai/AiBibleService';
import { useAccessibility } from '@/hooks/useAccessibility';
import { AngelAvatar } from '@/components/common/AngelAvatar';
import { AssistantOverlay } from '@/components/voice/AssistantOverlay';
import {
  TTS_SPEED_STEP,
  MIN_TTS_SPEED,
  MAX_TTS_SPEED,
} from '@/constants/config';

const RESTART_DELAY_MS = 800;
const ERROR_RESTART_DELAY_MS = 2000;

/**
 * Wake word — say "Prince" (optionally "Hey Prince") anywhere in a sentence to
 * open the assistant. Includes common mis-hearings by speech recognizers.
 * Lookarounds instead of \b so it also works for Tamil script.
 */
const WAKE_WORD_RE =
  /(?:^|[\s,.!?])(?:(?:hey|hi|ok|okay)\s+)?(?:prince|prints|prinz|பிரின்ஸ்)(?=$|[\s,.!?:])[\s,.!?:]*/i;

/** Phrases that dismiss the assistant overlay. */
const CLOSE_RE = /^(?:close|cancel|exit|done|thank you|thanks|bye|மூடு|நன்றி)[\s.!]*$/i;

function splitWakeWord(text: string): { woke: boolean; rest: string } {
  const match = WAKE_WORD_RE.exec(text);
  if (!match) return { woke: false, rest: text.trim() };
  return { woke: true, rest: text.slice(match.index + match[0].length).trim() };
}

const { width: SCREEN_W } = Dimensions.get('window');
const ANGEL_OVERLAY_SIZE = Math.min(SCREEN_W * 0.22, 90);

interface Props {
  children: React.ReactNode;
}

export function GlobalVoiceProvider({ children }: Props) {
  const { colors } = useAccessibility();

  // Voice store
  const isListening = useVoiceStore((s) => s.isListening);
  const setListening = useVoiceStore((s) => s.setListening);
  const setTranscript = useVoiceStore((s) => s.setTranscript);
  const setPartialTranscript = useVoiceStore((s) => s.setPartialTranscript);
  const setError = useVoiceStore((s) => s.setError);
  const recognitionLanguage = useVoiceStore((s) => s.recognitionLanguage);
  const setRecognitionLanguage = useVoiceStore((s) => s.setRecognitionLanguage);
  const angelState = useVoiceStore((s) => s.angelState);
  const setAngelState = useVoiceStore((s) => s.setAngelState);
  const assistantPhase = useVoiceStore((s) => s.assistantPhase);
  const openAssistant = useVoiceStore((s) => s.openAssistant);
  const closeAssistant = useVoiceStore((s) => s.closeAssistant);
  const setAssistantThinking = useVoiceStore((s) => s.setAssistantThinking);
  const setAssistantAnswer = useVoiceStore((s) => s.setAssistantAnswer);
  const setAssistantError = useVoiceStore((s) => s.setAssistantError);

  // Settings
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const ttsSpeed = useSettingsStore((s) => s.ttsSpeed);
  const setTtsSpeed = useSettingsStore((s) => s.setTtsSpeed);

  // Search / Playback
  const setQuery = useSearchStore((s) => s.setQuery);
  const setSpeakingStatus = usePlaybackStore((s) => s.setSpeakingStatus);
  const setLastAiAnswer = usePlaybackStore((s) => s.setLastAiAnswer);

  const mountedRef = useRef(true);
  const cleanupFns = useRef<Array<() => void>>([]);
  const alwaysOnRef = useRef(true); // Always on by default
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionLanguageRef = useRef(recognitionLanguage);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  /** Incremented per question so a late answer for a dismissed question is dropped. */
  const askSeqRef = useRef(0);
  const scheduleRestartRef = useRef<(delay: number) => void>(() => {});

  const speak = useCallback((text: string, lang: 'en' | 'ta') => {
    setAngelState('speaking');
    void ttsService.speak(text, lang, useSettingsStore.getState().ttsSpeed).catch(() => {});
  }, [setAngelState]);

  // Track TTS speaking state to update angel, and resume listening once
  // speech finishes (the mic stays off while speaking to avoid hearing itself).
  useEffect(() => {
    const poll = async () => {
      let speaking = ttsService.isSpeaking();
      // Some engines (notably Chrome on web) occasionally never fire the
      // utterance's end callback. Ask the engine directly so the mic can't
      // stay off forever.
      if (speaking && ttsService.speakingForMs() > 1500 && !(await ttsService.isSpeakingAsync())) {
        await ttsService.stop();
        speaking = false;
      }
      if (speaking !== isSpeakingRef.current) {
        isSpeakingRef.current = speaking;
        if (speaking) {
          setAngelState('speaking');
        } else if (!isProcessingRef.current) {
          setAngelState(useVoiceStore.getState().isListening ? 'listening' : 'idle');
          if (alwaysOnRef.current && !useVoiceStore.getState().isListening) {
            scheduleRestartRef.current(RESTART_DELAY_MS);
          }
        }
      }
    };
    const interval = setInterval(() => void poll(), 200);
    return () => clearInterval(interval);
  }, [setAngelState]);

  // Keep language ref fresh
  useEffect(() => {
    recognitionLanguageRef.current = recognitionLanguage;
  }, [recognitionLanguage]);

  // Sync recognitionLanguage with primary language changes
  const lastPrimaryLanguageRef = useRef(primaryLanguage);
  useEffect(() => {
    if (lastPrimaryLanguageRef.current !== primaryLanguage) {
      lastPrimaryLanguageRef.current = primaryLanguage;
      setRecognitionLanguage(primaryLanguage);
    }
  }, [primaryLanguage, setRecognitionLanguage]);

  const handlePartial = useCallback(
    (text: string) => {
      const { woke, rest } = splitWakeWord(text);
      const phase = useVoiceStore.getState().assistantPhase;
      if (phase === 'closed') {
        if (!woke) return; // ambient speech — don't show anything
        // Wake immediately on the partial result so the overlay feels instant.
        openAssistant();
        void ttsService.stop();
        if (useSettingsStore.getState().hapticsEnabled) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
      setPartialTranscript(rest);
    },
    [openAssistant, setPartialTranscript],
  );

  const startSession = useCallback(async () => {
    if (!mountedRef.current || isProcessingRef.current || isSpeakingRef.current) return;

    try {
      const available = await speechService.isAvailable();
      if (!available) return;

      const permitted = await speechService.requestPermissions();
      if (!permitted) return;

      cleanupFns.current.forEach((fn) => fn());
      cleanupFns.current = [];

      setError(null);
      setPartialTranscript('');

      cleanupFns.current.push(
        speechService.onPartialResult((text) => {
          if (mountedRef.current) {
            handlePartial(text);
          }
        }),
      );

      cleanupFns.current.push(
        speechService.onFinalResult((text) => {
          if (mountedRef.current) {
            handleFinalTranscriptRef.current(text);
          }
        }),
      );

      cleanupFns.current.push(
        speechService.onError((err) => {
          if (mountedRef.current) {
            if (err !== 'no-speech' && err !== 'aborted') {
              setError(err);
            }
            setListening(false);
            if (!isProcessingRef.current && !isSpeakingRef.current) {
              setAngelState('idle');
            }
            if (alwaysOnRef.current) {
              scheduleRestartRef.current(ERROR_RESTART_DELAY_MS);
            }
          }
        }),
      );

      cleanupFns.current.push(
        speechService.onEnd(() => {
          if (mountedRef.current) {
            setListening(false);
            if (!isProcessingRef.current && !isSpeakingRef.current) {
              setAngelState('idle');
            }
            if (alwaysOnRef.current && !isProcessingRef.current) {
              scheduleRestartRef.current(RESTART_DELAY_MS);
            }
          }
        }),
      );

      const locale = recognitionLanguageRef.current === 'ta' ? 'ta-IN' : 'en-US';
      await speechService.startListening(locale);
      setListening(true);
      setAngelState('listening');
    } catch {
      setListening(false);
      setAngelState('idle');
      if (alwaysOnRef.current) {
        scheduleRestartRef.current(ERROR_RESTART_DELAY_MS);
      }
    }
  }, [setListening, setError, setPartialTranscript, setAngelState, handlePartial]);

  const scheduleRestart = useCallback((delay: number) => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      if (alwaysOnRef.current && mountedRef.current) {
        void startSession();
      }
    }, delay);
  }, [startSession]);
  scheduleRestartRef.current = scheduleRestart;

  // --- Auto-start on mount ---
  useEffect(() => {
    mountedRef.current = true;
    alwaysOnRef.current = true;
    // Small delay for navigation to settle
    const timer = setTimeout(() => {
      void startSession();
    }, 1500);
    return () => {
      clearTimeout(timer);
      mountedRef.current = false;
      alwaysOnRef.current = false;
      cleanupFns.current.forEach((fn) => fn());
      cleanupFns.current = [];
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      void speechService.cancelListening();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAskAi = useCallback(
    (question: string) => {
      const lang = recognitionLanguageRef.current;
      const seq = ++askSeqRef.current;
      isProcessingRef.current = true;
      // Show what was heard right away, before the AI round-trip.
      setAssistantThinking(question);
      setAngelState('processing');
      void ttsService.stop();

      askAnything(question, lang)
        .then((res) => {
          if (!mountedRef.current || seq !== askSeqRef.current) return;
          if (useVoiceStore.getState().assistantPhase === 'closed') return;
          setLastAiAnswer(res.answer, res.detectedLanguage);
          setAssistantAnswer(res.answer, res.verses ?? [], res.questionTranslation ?? '');
          speak(res.answer, res.detectedLanguage);
          AccessibilityInfo.announceForAccessibility(res.answer.slice(0, 200));
        })
        .catch((err: unknown) => {
          if (!mountedRef.current || seq !== askSeqRef.current) return;
          if (useVoiceStore.getState().assistantPhase === 'closed') return;
          const errorMsg = err instanceof Error && err.message
            ? err.message
            : lang === 'ta'
              ? 'மன்னிக்கவும், இப்போது பதிலளிக்க முடியவில்லை.'
              : 'Sorry, I could not answer that right now.';
          setAssistantError(errorMsg);
          speak(errorMsg, lang);
        })
        .finally(() => {
          if (seq !== askSeqRef.current) return;
          isProcessingRef.current = false;
          if (alwaysOnRef.current && mountedRef.current) {
            scheduleRestart(RESTART_DELAY_MS);
          }
        });
    },
    [setLastAiAnswer, setAngelState, setAssistantThinking, setAssistantAnswer, setAssistantError, speak, scheduleRestart],
  );

  const announceAndRestart = useCallback(
    (msg: string) => {
      AccessibilityInfo.announceForAccessibility(msg);
      scheduleRestart(RESTART_DELAY_MS);
    },
    [scheduleRestart],
  );

  const dismissAssistant = useCallback(() => {
    askSeqRef.current++; // drop any in-flight answer
    isProcessingRef.current = false;
    void ttsService.stop();
    setSpeakingStatus('idle');
    setPartialTranscript('');
    closeAssistant();
    setAngelState(useVoiceStore.getState().isListening ? 'listening' : 'idle');
    scheduleRestart(RESTART_DELAY_MS);
  }, [closeAssistant, setAngelState, setPartialTranscript, setSpeakingStatus, scheduleRestart]);

  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (!mountedRef.current || !text.trim()) return;

      const { woke, rest } = splitWakeWord(text);
      const engaged = useVoiceStore.getState().assistantPhase !== 'closed';
      setPartialTranscript('');

      // Always-on mic: ignore background speech unless the wake word was
      // said or the assistant is already open waiting for a question.
      if (!woke && !engaged) {
        scheduleRestart(RESTART_DELAY_MS);
        return;
      }

      if (!engaged) {
        openAssistant();
        if (hapticsEnabled) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      const query = rest;

      // Only the wake word — prompt for the question and keep listening.
      if (!query) {
        openAssistant();
        const greeting = recognitionLanguageRef.current === 'ta' ? 'சொல்லுங்கள்.' : 'Yes?';
        speak(greeting, recognitionLanguageRef.current);
        AccessibilityInfo.announceForAccessibility(greeting);
        scheduleRestart(RESTART_DELAY_MS);
        return;
      }

      if (CLOSE_RE.test(query)) {
        dismissAssistant();
        return;
      }

      setTranscript(query);
      setListening(false);

      if (hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Try voice command first
      const parsed = voiceCommandParser.parse(query);

      if (!parsed) {
        // No command matched — send as AI question
        setQuery(query);
        handleAskAi(query);
        return;
      }

      // Navigation commands leave the assistant so the target screen is visible.
      const navigate = (fn: () => void) => {
        dismissAssistant();
        fn();
      };

      switch (parsed.command) {
        case 'search':
        case 'ask':
        case 'searchInTamil':
        case 'searchInEnglish':
          if (parsed.args) {
            setQuery(parsed.args);
            handleAskAi(parsed.args);
          } else {
            scheduleRestart(RESTART_DELAY_MS);
          }
          break;

        case 'stop':
          if (ttsService.isSpeaking()) {
            void ttsService.stop();
            setSpeakingStatus('idle');
            setAngelState('idle');
            announceAndRestart('Stopped.');
          } else {
            dismissAssistant();
          }
          break;

        case 'repeat': {
          const state = usePlaybackStore.getState();
          const answer = state.lastAiAnswer;
          const lang = state.lastAiLanguage ?? recognitionLanguageRef.current;
          if (answer) {
            speak(answer, lang);
          }
          scheduleRestart(RESTART_DELAY_MS);
          break;
        }

        case 'repeatFrom':
        case 'repeatVerse':
          if (parsed.args) {
            handleAskAi(`Read verse ${parsed.args}`);
          } else {
            scheduleRestart(RESTART_DELAY_MS);
          }
          break;

        case 'slowDown': {
          const newSpeed = Math.max(MIN_TTS_SPEED, ttsSpeed - TTS_SPEED_STEP);
          setTtsSpeed(newSpeed);
          announceAndRestart(`Speed: ${newSpeed}x`);
          break;
        }

        case 'speedUp': {
          const newSpeed = Math.min(MAX_TTS_SPEED, ttsSpeed + TTS_SPEED_STEP);
          setTtsSpeed(newSpeed);
          announceAndRestart(`Speed: ${newSpeed}x`);
          break;
        }

        case 'speakEnglish':
          setRecognitionLanguage('en');
          recognitionLanguageRef.current = 'en';
          announceAndRestart('Switched to English');
          break;

        case 'speakTamil':
          setRecognitionLanguage('ta');
          recognitionLanguageRef.current = 'ta';
          announceAndRestart('Switched to Tamil');
          break;

        case 'openHome':
        case 'openSearch':
          navigate(() => navigateToTab('Home'));
          break;

        case 'openFavorites':
        case 'listSaved':
        case 'readSaved':
          navigate(() => navigateToTab('Favorites'));
          break;

        case 'openSettings':
          navigate(() => navigateToTab('Settings'));
          break;

        case 'openVoiceHelp':
        case 'help':
          navigate(() => navigateToVoiceCommands());
          break;

        case 'saveVerse':
        case 'bookmark':
        case 'dailyVerse':
        case 'nextVerse':
        case 'previousVerse':
        case 'read':
        case 'readContext':
        case 'share':
        case 'recordReflection':
        case 'startMemorization':
          // Screen-specific commands — handled by the screen behind the overlay.
          navigate(() => {});
          break;

        default:
          // Unrecognized command — treat as question
          setQuery(query);
          handleAskAi(query);
          break;
      }
    },
    [
      setTranscript,
      setListening,
      setQuery,
      setPartialTranscript,
      setSpeakingStatus,
      setAngelState,
      setRecognitionLanguage,
      openAssistant,
      ttsSpeed,
      setTtsSpeed,
      hapticsEnabled,
      scheduleRestart,
      handleAskAi,
      announceAndRestart,
      dismissAssistant,
      speak,
    ],
  );
  // Speech callbacks are registered once per session; read the latest handler.
  const handleFinalTranscriptRef = useRef(handleFinalTranscript);
  handleFinalTranscriptRef.current = handleFinalTranscript;

  /** Open the assistant and start listening for a question right away. */
  const listenForQuestion = useCallback(async () => {
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    askSeqRef.current++;
    isProcessingRef.current = false;
    await ttsService.stop();
    isSpeakingRef.current = false;
    openAssistant();
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    await speechService.cancelListening().catch(() => {});
    await startSession();
  }, [hapticsEnabled, openAssistant, startSession]);

  const stopSpeaking = useCallback(() => {
    void ttsService.stop();
    setSpeakingStatus('idle');
  }, [setSpeakingStatus]);

  // Tap angel to open the assistant (or stop listening if already open)
  const handleAngelPress = useCallback(async () => {
    if (isListening && assistantPhase !== 'closed') {
      try {
        await speechService.stopListening();
      } catch { /* ok */ }
      setListening(false);
      setAngelState('idle');
    } else {
      await listenForQuestion();
    }
  }, [isListening, assistantPhase, listenForQuestion, setListening, setAngelState]);

  // Status label for the angel
  const statusLabel =
    angelState === 'listening'
      ? 'Listening...'
      : angelState === 'processing'
        ? 'Thinking...'
        : angelState === 'speaking'
          ? 'Speaking...'
          : '';

  return (
    <View style={{ flex: 1 }}>
      {children}

      {/* Floating Angel — always visible while the assistant is closed */}
      {assistantPhase === 'closed' ? (
        <View style={styles.angelOverlay} pointerEvents="box-none">
          <Pressable
            onPress={handleAngelPress}
            accessibilityRole="button"
            accessibilityLabel="Open the assistant. Or say Prince anytime to ask a question."
            style={styles.angelPressable}
          >
            <AngelAvatar
              state={angelState}
              size={ANGEL_OVERLAY_SIZE}
              glowColor={colors.angelGlow}
              accentColor={colors.accent}
            />
          </Pressable>

          {/* Status text */}
          {statusLabel ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <View style={[styles.statusDot, {
                backgroundColor:
                  angelState === 'listening' ? colors.accent
                  : angelState === 'processing' ? colors.accentLight
                  : colors.success,
              }]} />
              <Text style={[styles.statusText, { color: colors.text }]}>
                {statusLabel}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <AssistantOverlay
        onClose={dismissAssistant}
        onAskAgain={() => void listenForQuestion()}
        onStopSpeaking={stopSpeaking}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  angelOverlay: {
    position: 'absolute',
    bottom: 88,
    right: 8,
    alignItems: 'center',
    zIndex: 999,
  },
  angelPressable: {
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
