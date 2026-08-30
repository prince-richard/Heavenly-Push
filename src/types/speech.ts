export interface SpeechRecognitionAdapter {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  startListening(language: 'en-US' | 'ta-IN'): Promise<void>;
  stopListening(): Promise<void>;
  cancelListening(): Promise<void>;
  onPartialResult(callback: (text: string) => void): () => void;
  onFinalResult(callback: (text: string) => void): () => void;
  onError(callback: (error: string) => void): () => void;
  /** Called when speech recognition session ends (naturally or after error). */
  onEnd(callback: () => void): () => void;
}

export type SpeakingStatus = 'idle' | 'speaking' | 'paused';

export type VoiceCommand =
  | 'search'
  | 'ask'
  | 'read'
  | 'readContext'
  | 'bookmark'
  | 'share'
  | 'slowDown'
  | 'speedUp'
  | 'repeat'
  | 'repeatFrom'
  | 'repeatVerse'
  | 'stop'
  | 'recordReflection'
  | 'startMemorization'
  | 'openFavorites'
  | 'openHome'
  | 'openSearch'
  | 'openSettings'
  | 'openVoiceHelp'
  | 'dailyVerse'
  | 'searchInTamil'
  | 'searchInEnglish'
  | 'speakEnglish'
  | 'speakTamil'
  | 'saveVerse'
  | 'listSaved'
  | 'readSaved'
  | 'nextVerse'
  | 'previousVerse'
  | 'help';

export interface ParsedVoiceCommand {
  command: VoiceCommand;
  args?: string;
}

export interface VoiceCommandInfo {
  command: VoiceCommand;
  englishPhrases: string[];
  tamilPhrases: string[];
  description_en: string;
  description_ta: string;
  category: 'playback' | 'navigation' | 'save' | 'language' | 'search' | 'other';
}
