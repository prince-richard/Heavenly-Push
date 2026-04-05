export interface SpeechRecognitionAdapter {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  startListening(language: 'en-US' | 'ta-IN'): Promise<void>;
  stopListening(): Promise<void>;
  cancelListening(): Promise<void>;
  onPartialResult(callback: (text: string) => void): () => void;
  onFinalResult(callback: (text: string) => void): () => void;
  onError(callback: (error: string) => void): () => void;
}

export type SpeakingStatus = 'idle' | 'speaking' | 'paused';

export type VoiceCommand =
  | 'search'
  | 'read'
  | 'readContext'
  | 'bookmark'
  | 'share'
  | 'slowDown'
  | 'speedUp'
  | 'repeat'
  | 'stop'
  | 'recordReflection'
  | 'startMemorization'
  | 'openFavorites'
  | 'dailyVerse'
  | 'searchInTamil'
  | 'searchInEnglish';

export interface ParsedVoiceCommand {
  command: VoiceCommand;
  args?: string;
}
