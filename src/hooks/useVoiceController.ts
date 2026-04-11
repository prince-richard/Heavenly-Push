import { useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { speechService } from '@/services/speech/SpeechService';
import { ttsService } from '@/services/audio/TTSService';
import { voiceCommandParser } from '@/services/speech/VoiceCommandParser';
import { useVoiceStore } from '@/stores/useVoiceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSearchStore } from '@/stores/useSearchStore';
import { usePlaybackStore } from '@/stores/usePlaybackStore';
import { navigateToTab } from '@/app/navigation/navigationRef';
import { askAnything } from '@/services/ai/AiBibleService';
import {
  TTS_SPEED_STEP,
  MIN_TTS_SPEED,
  MAX_TTS_SPEED,
} from '@/constants/config';

/**
 * Central voice orchestration hook.
 * Manages the TTS/STT mutex, routes voice commands, and updates stores.
 */
export function useVoiceController() {
  const cleanupFns = useRef<Array<() => void>>([]);
  const mountedRef = useRef(true);

  // Voice store
  const isListening = useVoiceStore((s) => s.isListening);
  const transcript = useVoiceStore((s) => s.transcript);
  const error = useVoiceStore((s) => s.error);
  const recognitionLanguage = useVoiceStore((s) => s.recognitionLanguage);
  const setListening = useVoiceStore((s) => s.setListening);
  const setTranscript = useVoiceStore((s) => s.setTranscript);
  const setPartialTranscript = useVoiceStore((s) => s.setPartialTranscript);
  const setError = useVoiceStore((s) => s.setError);
  const setRecognitionLanguage = useVoiceStore((s) => s.setRecognitionLanguage);

  // Settings
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const ttsSpeed = useSettingsStore((s) => s.ttsSpeed);
  const setTtsSpeed = useSettingsStore((s) => s.setTtsSpeed);

  // Search store
  const setQuery = useSearchStore((s) => s.setQuery);

  // Playback store
  const setSpeakingStatus = usePlaybackStore((s) => s.setSpeakingStatus);
  const setLastAiAnswer = usePlaybackStore((s) => s.setLastAiAnswer);

  // Sync recognitionLanguage to the user's primary language on first
  // mount and whenever the user changes their primary language in
  // Settings — but only if the user hasn't manually flipped it via the
  // Home pill since (we treat any explicit pill flip as the source of
  // truth until the next settings change).
  const lastPrimaryLanguageRef = useRef(primaryLanguage);
  useEffect(() => {
    if (lastPrimaryLanguageRef.current !== primaryLanguage) {
      lastPrimaryLanguageRef.current = primaryLanguage;
      setRecognitionLanguage(primaryLanguage);
    }
  }, [primaryLanguage, setRecognitionLanguage]);

  // Keep fresh refs so the final-transcript handler doesn't use stale closures.
  const recognitionLanguageRef = useRef(recognitionLanguage);
  useEffect(() => {
    recognitionLanguageRef.current = recognitionLanguage;
  }, [recognitionLanguage]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cleanup all listeners on unmount
      cleanupFns.current.forEach((fn) => fn());
      cleanupFns.current = [];
    };
  }, []);

  /**
   * Handle a final transcript: parse for commands, fallback to search.
   */
  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (!mountedRef.current) return;

      setTranscript(text);
      setListening(false);

      const parsed = voiceCommandParser.parse(text);

      if (!parsed) {
        // No command matched — let HomeScreen pick it up via the
        // transcript store and ask the AI directly. Search store is
        // still updated for back-compat.
        setQuery(text);
        return;
      }

      switch (parsed.command) {
        case 'search':
          // Search is now part of the home assistant — route through ask.
          if (parsed.args) {
            setQuery(parsed.args);
            navigateToTab('Home');
          }
          break;

        case 'ask': {
          // Global "ask the AI" command — works from any screen.
          if (!parsed.args) break;
          const lang = recognitionLanguageRef.current;
          void ttsService.stop();
          askAnything(parsed.args, lang)
            .then((res) => {
              setLastAiAnswer(res.answer, res.detectedLanguage);
              void ttsService.speak(res.answer, res.detectedLanguage);
            })
            .catch(() => {
              void ttsService.speak(
                'Sorry, I could not answer that right now.',
                lang,
              );
            });
          break;
        }

        case 'stop':
          void ttsService.stop();
          setSpeakingStatus('idle');
          break;

        case 'repeat': {
          // Replay the last AI answer, regardless of which screen.
          const state = usePlaybackStore.getState();
          const answer = state.lastAiAnswer;
          const lang = state.lastAiLanguage ?? recognitionLanguageRef.current;
          if (answer) {
            void ttsService.speak(answer, lang);
          }
          break;
        }

        case 'slowDown': {
          const newSpeed = Math.max(MIN_TTS_SPEED, ttsSpeed - TTS_SPEED_STEP);
          setTtsSpeed(newSpeed);
          break;
        }

        case 'speedUp': {
          const newSpeed = Math.min(MAX_TTS_SPEED, ttsSpeed + TTS_SPEED_STEP);
          setTtsSpeed(newSpeed);
          break;
        }

        case 'speakEnglish':
          setRecognitionLanguage('en');
          recognitionLanguageRef.current = 'en';
          break;

        case 'speakTamil':
          setRecognitionLanguage('ta');
          recognitionLanguageRef.current = 'ta';
          break;

        case 'openHome':
        case 'openSearch':
          // Search no longer has its own tab; both go home.
          navigateToTab('Home');
          break;

        case 'openFavorites':
          navigateToTab('Favorites');
          break;

        case 'openSettings':
          navigateToTab('Settings');
          break;

        // Commands that need screen context to execute:
        // read, readContext, bookmark, share, recordReflection,
        // startMemorization, dailyVerse, searchInTamil, searchInEnglish
        // These remain exposed via the transcript/parsed command for
        // the UI layer to handle.
        case 'searchInTamil':
        case 'searchInEnglish':
        case 'read':
        case 'readContext':
        case 'bookmark':
        case 'share':
        case 'recordReflection':
        case 'startMemorization':
        case 'dailyVerse':
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
    ],
  );

  /**
   * Start listening for voice input.
   * CRITICAL: Stops TTS before starting mic (TTS/STT mutex).
   */
  const startListening = useCallback(async () => {
    try {
      // TTS/STT mutex: always stop TTS first
      await ttsService.stop();
      setSpeakingStatus('idle');

      // Check availability
      const available = await speechService.isAvailable();
      if (!available) {
        setError('Speech recognition is not available on this device');
        return;
      }

      // Request permissions
      const permitted = await speechService.requestPermissions();
      if (!permitted) {
        setError('Microphone permission denied');
        return;
      }

      // Clear previous state
      setError(null);
      setTranscript('');
      setPartialTranscript('');

      // Wire up callbacks
      cleanupFns.current.forEach((fn) => fn());
      cleanupFns.current = [];

      cleanupFns.current.push(
        speechService.onPartialResult((text) => {
          if (mountedRef.current) {
            setPartialTranscript(text);
          }
        }),
      );

      cleanupFns.current.push(
        speechService.onFinalResult((text) => {
          handleFinalTranscript(text);
        }),
      );

      cleanupFns.current.push(
        speechService.onError((err) => {
          if (mountedRef.current) {
            setError(err);
            setListening(false);
          }
        }),
      );

      // Map language to recognition locale — read from voice store so
      // the Home pill controls it without mutating user settings.
      const locale = recognitionLanguage === 'ta' ? 'ta-IN' : 'en-US';
      await speechService.startListening(locale);

      setListening(true);

      // Haptic feedback on mic start
      if (hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to start voice input';
      setError(message);
      setListening(false);
    }
  }, [
    recognitionLanguage,
    hapticsEnabled,
    setSpeakingStatus,
    setError,
    setTranscript,
    setPartialTranscript,
    setListening,
    handleFinalTranscript,
  ]);

  /**
   * Stop listening for voice input.
   */
  const stopListening = useCallback(async () => {
    try {
      await speechService.stopListening();
    } catch {
      // Swallow — may not be listening
    }
    setListening(false);

    // Cleanup listeners
    cleanupFns.current.forEach((fn) => fn());
    cleanupFns.current = [];
  }, [setListening]);

  return {
    startListening,
    stopListening,
    isListening,
    transcript,
    error,
  };
}
