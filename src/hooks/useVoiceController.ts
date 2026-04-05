import { useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { speechService } from '@/services/speech/SpeechService';
import { ttsService } from '@/services/audio/TTSService';
import { voiceCommandParser } from '@/services/speech/VoiceCommandParser';
import { useVoiceStore } from '@/stores/useVoiceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSearchStore } from '@/stores/useSearchStore';
import { usePlaybackStore } from '@/stores/usePlaybackStore';
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
  const setListening = useVoiceStore((s) => s.setListening);
  const setTranscript = useVoiceStore((s) => s.setTranscript);
  const setPartialTranscript = useVoiceStore((s) => s.setPartialTranscript);
  const setError = useVoiceStore((s) => s.setError);

  // Settings
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const ttsSpeed = useSettingsStore((s) => s.ttsSpeed);
  const setTtsSpeed = useSettingsStore((s) => s.setTtsSpeed);

  // Search store
  const setQuery = useSearchStore((s) => s.setQuery);

  // Playback store
  const setSpeakingStatus = usePlaybackStore((s) => s.setSpeakingStatus);

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
        // No command matched — treat as search query
        setQuery(text);
        return;
      }

      switch (parsed.command) {
        case 'search':
          if (parsed.args) {
            setQuery(parsed.args);
          }
          break;

        case 'stop':
          void ttsService.stop();
          setSpeakingStatus('idle');
          break;

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

        // Commands that need screen context to execute:
        // read, readContext, bookmark, share, repeat, recordReflection,
        // startMemorization, openFavorites, dailyVerse, searchInTamil, searchInEnglish
        // These are exposed via the transcript/parsed command for the UI layer to handle.
        case 'searchInTamil':
        case 'searchInEnglish':
        case 'read':
        case 'readContext':
        case 'bookmark':
        case 'share':
        case 'repeat':
        case 'recordReflection':
        case 'startMemorization':
        case 'openFavorites':
        case 'dailyVerse':
          // Store the transcript so the UI layer can pick it up and act on it.
          // The UI components will re-parse or check voiceStore for the command.
          break;
      }
    },
    [setTranscript, setListening, setQuery, setSpeakingStatus, ttsSpeed, setTtsSpeed],
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

      // Map language to recognition locale
      const locale = primaryLanguage === 'ta' ? 'ta-IN' : 'en-US';
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
    primaryLanguage,
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
