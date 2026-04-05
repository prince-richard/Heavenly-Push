import { create } from 'zustand';

interface VoiceState {
  isListening: boolean;
  transcript: string;
  partialTranscript: string;
  error: string | null;
  voiceMode: boolean;
}

interface VoiceActions {
  setListening: (isListening: boolean) => void;
  setTranscript: (transcript: string) => void;
  setPartialTranscript: (partialTranscript: string) => void;
  setError: (error: string | null) => void;
  setVoiceMode: (voiceMode: boolean) => void;
  reset: () => void;
}

type VoiceStore = VoiceState & VoiceActions;

const initialState: VoiceState = {
  isListening: false,
  transcript: '',
  partialTranscript: '',
  error: null,
  voiceMode: false,
};

export const useVoiceStore = create<VoiceStore>()((set) => ({
  ...initialState,

  setListening: (isListening) => set({ isListening }),
  setTranscript: (transcript) => set({ transcript }),
  setPartialTranscript: (partialTranscript) => set({ partialTranscript }),
  setError: (error) => set({ error }),
  setVoiceMode: (voiceMode) => set({ voiceMode }),
  reset: () => set(initialState),
}));
