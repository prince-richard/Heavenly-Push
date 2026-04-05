import { isWeb } from '@/utils/platform';
import type { SpeechRecognitionAdapter } from '@/types/speech';
import { webSpeechProvider } from './WebSpeechProvider';
import { nativeSpeechProvider } from './NativeSpeechProvider';

/**
 * Factory that returns the platform-appropriate speech recognition provider.
 * Web → WebSpeechProvider, Native → NativeSpeechProvider.
 */
export function getProvider(): SpeechRecognitionAdapter {
  if (isWeb()) {
    return webSpeechProvider;
  }
  return nativeSpeechProvider;
}

export const speechService = getProvider();
