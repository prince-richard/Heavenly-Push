import { create } from 'zustand';

type AngelState = 'idle' | 'listening' | 'speaking' | 'processing';

/**
 * Full-screen assistant overlay, opened by the wake word or by tapping the angel.
 * closed → listening → thinking → answered (→ listening again for follow-ups) | error
 */
export type AssistantPhase = 'closed' | 'listening' | 'thinking' | 'answered' | 'error';

export interface AssistantVerse {
  reference: string;
  englishText: string;
  tamilText: string;
  snippet: string;
}

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
  assistantPhase: AssistantPhase;
  /** What the user asked (wake word stripped). */
  assistantQuestion: string;
  /** The question in the other language, returned with the answer. */
  assistantQuestionTranslation: string;
  assistantAnswer: string;
  assistantVerses: AssistantVerse[];
  assistantError: string | null;
}

interface VoiceActions {
  setListening: (isListening: boolean) => void;
  setTranscript: (transcript: string) => void;
  setPartialTranscript: (partialTranscript: string) => void;
  setError: (error: string | null) => void;
  setVoiceMode: (voiceMode: boolean) => void;
  setRecognitionLanguage: (language: 'en' | 'ta') => void;
  setAngelState: (state: AngelState) => void;
  openAssistant: () => void;
  closeAssistant: () => void;
  setAssistantThinking: (question: string) => void;
  setAssistantAnswer: (
    answer: string,
    verses: AssistantVerse[],
    questionTranslation: string,
  ) => void;
  setAssistantError: (error: string) => void;
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
  assistantPhase: 'closed',
  assistantQuestion: '',
  assistantQuestionTranslation: '',
  assistantAnswer: '',
  assistantVerses: [],
  assistantError: null,
};

const clearedAssistant = {
  assistantQuestion: '',
  assistantQuestionTranslation: '',
  assistantAnswer: '',
  assistantVerses: [],
  assistantError: null,
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
  openAssistant: () =>
    set((state) =>
      // Keep the previous exchange visible when re-listening for a follow-up.
      state.assistantPhase === 'closed' || state.assistantPhase === 'error'
        ? { assistantPhase: 'listening', ...clearedAssistant }
        : { assistantPhase: 'listening' },
    ),
  closeAssistant: () => set({ assistantPhase: 'closed', ...clearedAssistant }),
  setAssistantThinking: (assistantQuestion) =>
    set({ assistantPhase: 'thinking', ...clearedAssistant, assistantQuestion }),
  setAssistantAnswer: (assistantAnswer, assistantVerses, assistantQuestionTranslation) =>
    set({
      assistantPhase: 'answered',
      assistantAnswer,
      assistantVerses,
      assistantQuestionTranslation,
    }),
  setAssistantError: (assistantError) => set({ assistantPhase: 'error', assistantError }),
  reset: () =>
    set((state) => ({
      ...initialState,
      recognitionLanguage: state.recognitionLanguage,
    })),
}));
