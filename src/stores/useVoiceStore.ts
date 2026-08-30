import { create } from 'zustand';

interface VoiceState {
  isListening: boolean;
  transcript: string;
  partialTranscript: string;
  error: string | null;
  voiceMode: boolean;
  /**
   * Language used for the next speech-recognition session.
   * Ephemeral — does not persist or mutate user settings.
   * Defaults to user's primary language but can be flipped from the
   * Home screen pill so users can ask in either language without
   * digging into Settings.
   */
  recognitionLanguage: 'en' | 'ta';
}

interface VoiceActions {
  setListening: (isListening: boolean) => void;
  setTranscript: (transcript: string) => void;
  setPartialTranscript: (partialTranscript: string) => void;
  setError: (error: string | null) => void;
  setVoiceMode: (voiceMode: boolean) => void;
  setRecognitionLanguage: (language: 'en' | 'ta') => void;
  reset: () => void;
}

type VoiceStore = VoiceState & VoiceActions;

const initialState: VoiceState = {
  isListening: false,
  transcript: '',
  partialTranscript: '',
  error: null,
  voiceMode: false,
  recognitionLanguage: 'ta',
};

export const useVoiceStore = create<VoiceStore>()((set) => ({
  ...initialState,

  setListening: (isListening) => set({ isListening }),
  setTranscript: (transcript) => set({ transcript }),
  setPartialTranscript: (partialTranscript) => set({ partialTranscript }),
  setError: (error) => set({ error }),
  setVoiceMode: (voiceMode) => set({ voiceMode }),
  setRecognitionLanguage: (recognitionLanguage) => set({ recognitionLanguage }),
  reset: () =>
    set((state) => ({
      ...initialState,
      // Keep the user's recognition language pick across resets.
      recognitionLanguage: state.recognitionLanguage,
    })),
}));
