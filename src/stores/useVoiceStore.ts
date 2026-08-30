import { create } from 'zustand';

type AngelState = 'idle' | 'listening' | 'speaking' | 'processing';

interface VoiceState {
  isListening: boolean;
  transcript: string;
  partialTranscript: string;
  error: string | null;
  voiceMode: boolean;
  /**
   * Language used for the next speech-recognition session.
   * Ephemeral — does not persist or mutate user settings.
   */
  recognitionLanguage: 'en' | 'ta';
  /** Global angel animation state — driven by GlobalVoiceProvider. */
  angelState: AngelState;
}

interface VoiceActions {
  setListening: (isListening: boolean) => void;
  setTranscript: (transcript: string) => void;
  setPartialTranscript: (partialTranscript: string) => void;
  setError: (error: string | null) => void;
  setVoiceMode: (voiceMode: boolean) => void;
  setRecognitionLanguage: (language: 'en' | 'ta') => void;
  setAngelState: (state: AngelState) => void;
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
  angelState: 'idle',
};

export const useVoiceStore = create<VoiceStore>()((set) => ({
  ...initialState,

  setListening: (isListening) => set({ isListening }),
  setTranscript: (transcript) => set({ transcript }),
  setPartialTranscript: (partialTranscript) => set({ partialTranscript }),
  setError: (error) => set({ error }),
  setVoiceMode: (voiceMode) => set({ voiceMode }),
  setRecognitionLanguage: (recognitionLanguage) => set({ recognitionLanguage }),
  setAngelState: (angelState) => set({ angelState }),
  reset: () =>
    set((state) => ({
      ...initialState,
      recognitionLanguage: state.recognitionLanguage,
    })),
}));
