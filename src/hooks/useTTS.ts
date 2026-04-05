import { useCallback, useEffect, useRef, useState } from 'react';
import { ttsService } from '@/services/audio/TTSService';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePlaybackStore } from '@/stores/usePlaybackStore';
import type { BibleVerse, SupportedLanguage } from '@/types/models';

/**
 * Hook for Text-to-Speech functionality.
 * Wraps TTSService with store integration and language fallback logic.
 */
export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mountedRef = useRef(true);

  const ttsSpeed = useSettingsStore((s) => s.ttsSpeed);
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const setSpeakingStatus = usePlaybackStore((s) => s.setSpeakingStatus);
  const setCurrentVerse = usePlaybackStore((s) => s.setCurrentVerse);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateState = useCallback(
    (speaking: boolean) => {
      if (mountedRef.current) {
        setIsSpeaking(speaking);
        setSpeakingStatus(speaking ? 'speaking' : 'idle');
      }
    },
    [setSpeakingStatus],
  );

  /**
   * Speak a verse with language fallback logic.
   * If preferred language text is null, falls back to the other language.
   */
  const speakVerse = useCallback(
    async (verse: BibleVerse, language?: SupportedLanguage) => {
      const lang = language ?? primaryLanguage;

      // Select text with fallback
      let text: string | undefined;
      let effectiveLang: SupportedLanguage = lang;

      if (lang === 'ta') {
        text = verse.textTa ?? verse.textEn;
        if (!verse.textTa && verse.textEn) effectiveLang = 'en';
      } else {
        text = verse.textEn ?? verse.textTa;
        if (!verse.textEn && verse.textTa) effectiveLang = 'ta';
      }

      if (!text) return;

      setCurrentVerse(verse.id);
      updateState(true);

      try {
        await ttsService.speak(text, effectiveLang, ttsSpeed);
      } catch {
        // TTS failure is non-fatal
      } finally {
        updateState(false);
        if (mountedRef.current) {
          setCurrentVerse(null);
        }
      }
    },
    [primaryLanguage, ttsSpeed, setCurrentVerse, updateState],
  );

  /**
   * Speak arbitrary text.
   */
  const speakText = useCallback(
    async (text: string, language?: SupportedLanguage) => {
      const lang = language ?? primaryLanguage;
      updateState(true);

      try {
        await ttsService.speak(text, lang, ttsSpeed);
      } catch {
        // TTS failure is non-fatal
      } finally {
        updateState(false);
      }
    },
    [primaryLanguage, ttsSpeed, updateState],
  );

  /**
   * Stop current TTS playback.
   */
  const stop = useCallback(() => {
    void ttsService.stop();
    updateState(false);
    setCurrentVerse(null);
  }, [updateState, setCurrentVerse]);

  return {
    speakVerse,
    speakText,
    stop,
    isSpeaking,
  };
}
