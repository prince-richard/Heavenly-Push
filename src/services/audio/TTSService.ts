import * as Speech from 'expo-speech';
import type { SupportedLanguage } from '@/types/models';

/**
 * Text-to-Speech service wrapping expo-speech.
 * Enforces single-session rule: only one utterance at a time.
 */

const LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-US',
  ta: 'ta-IN',
};

let currentlySpeaking = false;

/**
 * Speak text with the given language and speed.
 * Stops any current speech before starting new speech.
 */
async function speak(
  text: string,
  language: SupportedLanguage,
  speed: number = 1.0,
): Promise<void> {
  // Enforce single-session: stop any current speech first
  await stop();

  if (!text.trim()) return;

  return new Promise<void>((resolve, reject) => {
    currentlySpeaking = true;
    Speech.speak(text, {
      language: LANGUAGE_MAP[language],
      rate: Math.max(0.5, Math.min(2.0, speed)),
      onDone: () => {
        currentlySpeaking = false;
        resolve();
      },
      onError: (error) => {
        currentlySpeaking = false;
        reject(
          new Error(
            typeof error === 'string' ? error : 'TTS speech failed',
          ),
        );
      },
      onStopped: () => {
        currentlySpeaking = false;
        resolve();
      },
    });
  });
}

/**
 * Stop all current speech.
 */
async function stop(): Promise<void> {
  try {
    Speech.stop();
    currentlySpeaking = false;
  } catch {
    currentlySpeaking = false;
  }
}

/**
 * Pause current speech.
 * Note: expo-speech supports pause on iOS only. On other platforms this is a no-op.
 */
async function pause(): Promise<void> {
  try {
    Speech.pause();
  } catch {
    // pause not supported on all platforms — graceful no-op
  }
}

/**
 * Resume paused speech.
 * Note: expo-speech supports resume on iOS only. On other platforms this is a no-op.
 */
async function resume(): Promise<void> {
  try {
    Speech.resume();
  } catch {
    // resume not supported on all platforms — graceful no-op
  }
}

/**
 * Check if TTS is currently speaking.
 */
function isSpeaking(): boolean {
  return currentlySpeaking;
}

/**
 * Async check if TTS is speaking (uses expo-speech API).
 */
async function isSpeakingAsync(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return currentlySpeaking;
  }
}

export const ttsService = {
  speak,
  stop,
  pause,
  resume,
  isSpeaking,
  isSpeakingAsync,
};
