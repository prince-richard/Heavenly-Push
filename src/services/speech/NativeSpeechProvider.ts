import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import type { SpeechRecognitionAdapter } from '@/types/speech';

/**
 * Native speech recognition provider using @react-native-voice/voice.
 * Requires a development build (not Expo Go).
 */
class NativeSpeechProviderImpl implements SpeechRecognitionAdapter {
  async isAvailable(): Promise<boolean> {
    try {
      const services = await Voice.getSpeechRecognitionServices();
      return Array.isArray(services) && services.length > 0;
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // Voice.requestPermissions is not available on all platforms.
      // On Android, starting listening will auto-prompt for permission.
      // On iOS, permission is requested when Voice.start() is called.
      // We return true optimistically and handle denial in startListening.
      return true;
    } catch {
      return false;
    }
  }

  async startListening(language: 'en-US' | 'ta-IN'): Promise<void> {
    try {
      await Voice.start(language);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start listening';
      throw new Error(message);
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
    } catch {
      // Swallow errors on stop — may not be listening
    }
  }

  async cancelListening(): Promise<void> {
    try {
      await Voice.cancel();
    } catch {
      // Swallow errors on cancel
    }
  }

  onPartialResult(callback: (text: string) => void): () => void {
    const handler = (event: SpeechResultsEvent) => {
      const text = event.value?.[0];
      if (text) {
        callback(text);
      }
    };
    Voice.onSpeechPartialResults = handler;
    return () => {
      Voice.onSpeechPartialResults = undefined as unknown as (e: SpeechResultsEvent) => void;
    };
  }

  onFinalResult(callback: (text: string) => void): () => void {
    const handler = (event: SpeechResultsEvent) => {
      const text = event.value?.[0];
      if (text) {
        callback(text);
      }
    };
    Voice.onSpeechResults = handler;
    return () => {
      Voice.onSpeechResults = undefined as unknown as (e: SpeechResultsEvent) => void;
    };
  }

  onError(callback: (error: string) => void): () => void {
    const handler = (event: SpeechErrorEvent) => {
      const message =
        event.error?.message ?? event.error?.code ?? 'Speech recognition error';
      callback(String(message));
    };
    Voice.onSpeechError = handler;
    return () => {
      Voice.onSpeechError = undefined as unknown as (e: SpeechErrorEvent) => void;
    };
  }

  onEnd(callback: () => void): () => void {
    Voice.onSpeechEnd = () => {
      callback();
    };
    return () => {
      Voice.onSpeechEnd = undefined as unknown as (e: unknown) => void;
    };
  }
}

export const nativeSpeechProvider = new NativeSpeechProviderImpl();
