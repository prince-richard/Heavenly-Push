import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, AccessibilityInfo } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';
import {
  TTS_SPEED_STEP,
  MIN_TTS_SPEED,
  MAX_TTS_SPEED,
} from '@/constants/config';

const RESTART_DELAY_MS = 800;
const ERROR_RESTART_DELAY_MS = 2000;

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
  const alwaysOnRef = useRef(false);
  const [alwaysOn, setAlwaysOn] = useState(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionLanguageRef = useRef(recognitionLanguage);
  const isProcessingRef = useRef(false);

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
    if (!mountedRef.current || isProcessingRef.current) return;

    try {
      const available = await speechService.isAvailable();
      if (!available) return;

      const permitted = await speechService.requestPermissions();
      if (!permitted) return;

      // Clean previous listeners
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
            // Don't show "no-speech" as an error — just restart
            if (err !== 'no-speech') {
              setError(err);
            }
            setListening(false);
            // Auto-restart after error
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
            // Auto-restart if always-on is enabled
            if (alwaysOnRef.current && !isProcessingRef.current) {
              scheduleRestart(RESTART_DELAY_MS);
            }
          }
        }),
      );

      const locale = recognitionLanguageRef.current === 'ta' ? 'ta-IN' : 'en-US';
      await speechService.startListening(locale);
      setListening(true);
    } catch {
      setListening(false);
      if (alwaysOnRef.current) {
        scheduleRestart(ERROR_RESTART_DELAY_MS);
      }
    }
  }, [setListening, setError, setPartialTranscript]);

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

  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (!mountedRef.current || !text.trim()) return;

      setTranscript(text);
      setListening(false);

      if (hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const parsed = voiceCommandParser.parse(text);

      if (!parsed) {
        // No command matched — send as AI question
        setQuery(text);
        handleAskAi(text);
        return;
      }

      switch (parsed.command) {
        case 'search':
        case 'ask':
        case 'searchInTamil':
        case 'searchInEnglish':
          if (parsed.args) {
            setQuery(parsed.args);
            handleAskAi(parsed.args);
          }
          break;

        case 'stop':
          void ttsService.stop();
          setSpeakingStatus('idle');
          announceAndRestart('Stopped.');
          break;

        case 'repeat': {
          const state = usePlaybackStore.getState();
          const answer = state.lastAiAnswer;
          const lang = state.lastAiLanguage ?? recognitionLanguageRef.current;
          if (answer) {
            void ttsService.speak(answer, lang);
          }
          scheduleRestart(RESTART_DELAY_MS);
          break;
        }

        case 'repeatFrom':
        case 'repeatVerse':
          if (parsed.args) {
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
          // These are screen-context commands — set transcript so screens can pick up
          scheduleRestart(RESTART_DELAY_MS);
          break;

        default:
          scheduleRestart(RESTART_DELAY_MS);
          break;
      }
    },
    [
      setTranscript,
      setListening,
      setQuery,
      setSpeakingStatus,
      setLastAiAnswer,
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
      void ttsService.stop();

      askAnything(question, lang)
        .then((res) => {
          if (!mountedRef.current) return;
          setLastAiAnswer(res.answer, res.detectedLanguage);
          void ttsService.speak(res.answer, res.detectedLanguage);
          AccessibilityInfo.announceForAccessibility(res.answer.slice(0, 200));
        })
        .catch(() => {
          if (!mountedRef.current) return;
          const errorMsg = lang === 'ta'
            ? 'மன்னிக்கவும், இப்போது பதிலளிக்க முடியவில்லை.'
            : 'Sorry, I could not answer that right now.';
          void ttsService.speak(errorMsg, lang);
        })
        .finally(() => {
          isProcessingRef.current = false;
          if (alwaysOnRef.current && mountedRef.current) {
            scheduleRestart(RESTART_DELAY_MS);
          }
        });
    },
    [setLastAiAnswer, scheduleRestart],
  );

  const announceAndRestart = useCallback(
    (msg: string) => {
      AccessibilityInfo.announceForAccessibility(msg);
      scheduleRestart(RESTART_DELAY_MS);
    },
    [scheduleRestart],
  );

  // Toggle always-on listening
  const toggleAlwaysOn = useCallback(async () => {
    if (alwaysOnRef.current) {
      // Turn off
      alwaysOnRef.current = false;
      setAlwaysOn(false);
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      try {
        await speechService.stopListening();
      } catch {
        // ok
      }
      setListening(false);
      if (hapticsEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } else {
      // Turn on
      alwaysOnRef.current = true;
      setAlwaysOn(true);
      if (hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await startSession();
    }
  }, [startSession, setListening, hapticsEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      alwaysOnRef.current = false;
      cleanupFns.current.forEach((fn) => fn());
      cleanupFns.current = [];
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      void speechService.cancelListening();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {children}

      {/* Floating mic indicator */}
      <Pressable
        onPress={toggleAlwaysOn}
        accessibilityRole="button"
        accessibilityLabel={
          alwaysOn
            ? 'Voice commands active. Double tap to turn off.'
            : 'Turn on always-listening voice commands'
        }
        accessibilityState={{ selected: alwaysOn }}
        style={({ pressed }) => [
          styles.floatingMic,
          {
            backgroundColor: isListening
              ? colors.accent
              : alwaysOn
                ? colors.accentDark
                : colors.card,
            borderColor: isListening ? colors.gold : colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons
          name={isListening ? 'mic' : alwaysOn ? 'mic-outline' : 'mic-off-outline'}
          size={22}
          color={isListening || alwaysOn ? '#FFFFFF' : colors.textSecondary}
        />
        {isListening ? (
          <View style={[styles.listeningDot, { backgroundColor: colors.gold }]} />
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingMic: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  listeningDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
