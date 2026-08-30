import type { SpeechRecognitionAdapter } from '@/types/speech';

/**
 * Web Speech API provider using webkitSpeechRecognition / SpeechRecognition.
 * Gracefully degrades when API is unavailable.
 */

// Minimal type declarations for the Web Speech API (not available in React Native TS environment)
interface WebSpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { readonly transcript: string; readonly confidence: number } | undefined;
}

interface WebSpeechRecognitionResultList {
  readonly length: number;
  [index: number]: WebSpeechRecognitionResult | undefined;
}

interface WebSpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: WebSpeechRecognitionResultList;
}

interface WebSpeechRecognitionErrorEvent {
  readonly error: string;
  readonly message: string;
}

interface WebSpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface WebSpeechWindow {
  webkitSpeechRecognition?: new () => WebSpeechRecognitionInstance;
  SpeechRecognition?: new () => WebSpeechRecognitionInstance;
}

function getRecognitionConstructor():
  | (new () => WebSpeechRecognitionInstance)
  | undefined {
  if (typeof window === 'undefined') return undefined;
  const win = window as unknown as WebSpeechWindow;
  return win.SpeechRecognition ?? win.webkitSpeechRecognition;
}

class WebSpeechProviderImpl implements SpeechRecognitionAdapter {
  private recognition: WebSpeechRecognitionInstance | null = null;
  private partialCallback: ((text: string) => void) | null = null;
  private finalCallback: ((text: string) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private endCallback: (() => void) | null = null;

  async isAvailable(): Promise<boolean> {
    return getRecognitionConstructor() !== undefined;
  }

  async requestPermissions(): Promise<boolean> {
    // Web Speech API requests permission on first use via the browser
    if (!(await this.isAvailable())) return false;
    return true;
  }

  async startListening(language: 'en-US' | 'ta-IN'): Promise<void> {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) {
      throw new Error('Speech recognition not available on this browser');
    }

    // Stop any existing session
    this.destroyRecognition();

    this.recognition = new Ctor();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = language;

    this.recognition.onresult = (event: WebSpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result) {
          const transcript = result[0]?.transcript ?? '';
          if (result.isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }
      }

      if (interimText && this.partialCallback) {
        this.partialCallback(interimText);
      }
      if (finalText && this.finalCallback) {
        this.finalCallback(finalText);
      }
    };

    this.recognition.onerror = (event: WebSpeechRecognitionErrorEvent) => {
      if (this.errorCallback) {
        this.errorCallback(event.error || 'Speech recognition error');
      }
    };

    this.recognition.onend = () => {
      if (this.endCallback) {
        this.endCallback();
      }
    };

    try {
      this.recognition.start();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start listening';
      throw new Error(message);
    }
  }

  async stopListening(): Promise<void> {
    try {
      this.recognition?.stop();
    } catch {
      // Swallow — may not be listening
    }
  }

  async cancelListening(): Promise<void> {
    try {
      this.recognition?.abort();
    } catch {
      // Swallow
    }
    this.destroyRecognition();
  }

  onPartialResult(callback: (text: string) => void): () => void {
    this.partialCallback = callback;
    return () => {
      this.partialCallback = null;
    };
  }

  onFinalResult(callback: (text: string) => void): () => void {
    this.finalCallback = callback;
    return () => {
      this.finalCallback = null;
    };
  }

  onError(callback: (error: string) => void): () => void {
    this.errorCallback = callback;
    return () => {
      this.errorCallback = null;
    };
  }

  onEnd(callback: () => void): () => void {
    this.endCallback = callback;
    return () => {
      this.endCallback = null;
    };
  }

  private destroyRecognition(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore
      }
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition = null;
    }
  }
}

export const webSpeechProvider = new WebSpeechProviderImpl();
