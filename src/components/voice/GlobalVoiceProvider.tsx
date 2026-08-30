import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import {
  TTS_SPEED_STEP,
  MIN_TTS_SPEED,
  MAX_TTS_SPEED,
} from '@/constants/config';

const RESTART_DELAY_MS = 800;
const ERROR_RESTART_DELAY_MS = 2000;

/** Wake word — user says "Prince" to activate the angel. Case insensitive. */
const WAKE_WORD_RE = /^(?:prince|பிரின்ஸ்)\b[,.\s:]*/i;

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

  // Track TTS speaking state to update angel
  useEffect(() => {
    const interval = setInterval(() => {
      const speaking = ttsService.isSpeaking();
      if (speaking !== isSpeakingRef.current) {
        isSpeakingRef.current = speaking;
        if (speaking) {
          setAngelState('speaking');
        } else if (!isProcessingRef.current) {
          setAngelState(useVoiceStore.getState().isListening ? 'listening' : 'idle');
        }
      }
    }, 200);
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
            setPartialTranscript(text);
          }
        }),
      );

      cleanupFns.current.push(
        speechService.onFinalResult((text) => {
          if (mountedRef.current) {
            handleFinalTranscript(text);
          }
        }),
      );

      cleanupFns.current.push(
        speechService.onError((err) => {
          if (mountedRef.current) {
            if (err !== 'no-speech') {
              setError(err);
            }
            setListening(false);
            setAngelState('idle');
            if (alwaysOnRef.current) {
              scheduleRestart(ERROR_RESTART_DELAY_MS);
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
              scheduleRestart(RESTART_DELAY_MS);
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
        scheduleRestart(ERROR_RESTART_DELAY_MS);
      }
    }
  }, [setListening, setError, setPartialTranscript, setAngelState]);

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

  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (!mountedRef.current || !text.trim()) return;

      let query = text.trim();

      // Check for wake word "Prince"
      const hasWakeWord = WAKE_WORD_RE.test(query);
      if (hasWakeWord) {
        // Strip wake word
        query = query.replace(WAKE_WORD_RE, '').trim();
        // Navigate to Home when wake word is used
        navigateToTab('Home');
      }

      // If only the wake word was said with nothing after, just acknowledge
      if (!query) {
        if (hasWakeWord) {
          setAngelState('speaking');
          const lang = recognitionLanguageRef.current;
          const greeting = lang === 'ta'
            ? 'சொல்லுங்கள், நான் கேட்கிறேன்.'
            : 'Yes, I\'m listening.';
          void ttsService.speak(greeting, lang);
          AccessibilityInfo.announceForAccessibility(greeting);
        }
        scheduleRestart(RESTART_DELAY_MS);
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
        navigateToTab('Home');
        handleAskAi(query);
        return;
      }

      switch (parsed.command) {
        case 'search':
        case 'ask':
        case 'searchInTamil':
        case 'searchInEnglish':
          if (parsed.args) {
            setQuery(parsed.args);
            navigateToTab('Home');
            handleAskAi(parsed.args);
          }
          break;

        case 'stop':
          void ttsService.stop();
          setSpeakingStatus('idle');
          setAngelState('idle');
          announceAndRestart('Stopped.');
          break;

        case 'repeat': {
          const state = usePlaybackStore.getState();
          const answer = state.lastAiAnswer;
          const lang = state.lastAiLanguage ?? recognitionLanguageRef.current;
          if (answer) {
            setAngelState('speaking');
            void ttsService.speak(answer, lang);
          }
          scheduleRestart(RESTART_DELAY_MS);
          break;
        }

        case 'repeatFrom':
        case 'repeatVerse':
          if (parsed.args) {
            navigateToTab('Home');
            handleAskAi(`Read verse ${parsed.args}`);
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
          navigateToTab('Home');
          scheduleRestart(RESTART_DELAY_MS);
          break;

        case 'openFavorites':
        case 'listSaved':
        case 'readSaved':
          navigateToTab('Favorites');
          scheduleRestart(RESTART_DELAY_MS);
          break;

        case 'openSettings':
          navigateToTab('Settings');
          scheduleRestart(RESTART_DELAY_MS);
          break;

        case 'openVoiceHelp':
        case 'help':
          navigateToVoiceCommands();
          scheduleRestart(RESTART_DELAY_MS);
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
          scheduleRestart(RESTART_DELAY_MS);
          break;

        default:
          // Unrecognized command — treat as question
          setQuery(query);
          navigateToTab('Home');
          handleAskAi(query);
          break;
      }
    },
    [
      setTranscript,
      setListening,
      setQuery,
      setSpeakingStatus,
      setLastAiAnswer,
      setAngelState,
      setRecognitionLanguage,
      ttsSpeed,
      setTtsSpeed,
      hapticsEnabled,
      scheduleRestart,
    ],
  );

  const handleAskAi = useCallback(
    (question: string) => {
      const lang = recognitionLanguageRef.current;
      isProcessingRef.current = true;
      setAngelState('processing');
      void ttsService.stop();

      askAnything(question, lang)
        .then((res) => {
          if (!mountedRef.current) return;
          setLastAiAnswer(res.answer, res.detectedLanguage);
          setAngelState('speaking');
          void ttsService.speak(res.answer, res.detectedLanguage);
          AccessibilityInfo.announceForAccessibility(res.answer.slice(0, 200));
        })
        .catch(() => {
          if (!mountedRef.current) return;
          const errorMsg = lang === 'ta'
            ? 'மன்னிக்கவும், இப்போது பதிலளிக்க முடியவில்லை.'
            : 'Sorry, I could not answer that right now.';
          setAngelState('speaking');
          void ttsService.speak(errorMsg, lang);
        })
        .finally(() => {
          isProcessingRef.current = false;
          if (alwaysOnRef.current && mountedRef.current) {
            scheduleRestart(RESTART_DELAY_MS);
          }
        });
    },
    [setLastAiAnswer, setAngelState, scheduleRestart],
  );

  const announceAndRestart = useCallback(
    (msg: string) => {
      AccessibilityInfo.announceForAccessibility(msg);
      scheduleRestart(RESTART_DELAY_MS);
    },
    [scheduleRestart],
  );

  // Tap angel to manually trigger/stop
  const handleAngelPress = useCallback(async () => {
    if (isListening) {
      try {
        await speechService.stopListening();
      } catch { /* ok */ }
      setListening(false);
      setAngelState('idle');
    } else {
      if (hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      navigateToTab('Home');
      await startSession();
    }
  }, [isListening, startSession, setListening, setAngelState, hapticsEnabled]);

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

      {/* Floating Angel Overlay — always visible */}
      <View style={styles.angelOverlay} pointerEvents="box-none">
        <Pressable
          onPress={handleAngelPress}
          accessibilityRole="button"
          accessibilityLabel={
            angelState === 'listening'
              ? 'Angel is listening. Tap to stop.'
              : angelState === 'processing'
                ? 'Angel is thinking.'
                : angelState === 'speaking'
                  ? 'Angel is speaking. Tap to interrupt.'
                  : 'Tap the angel to start voice input. Or say Prince to activate.'
          }
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
