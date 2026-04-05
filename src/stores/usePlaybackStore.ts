import { create } from 'zustand';
import type { SpeakingStatus } from '@/types/speech';
import { DEFAULT_TTS_SPEED } from '@/constants/config';

interface PlaybackState {
  currentVerseId: string | null;
  speakingStatus: SpeakingStatus;
  speed: number;
  queue: string[];
}

interface PlaybackActions {
  setCurrentVerse: (verseId: string | null) => void;
  setSpeakingStatus: (status: SpeakingStatus) => void;
  setSpeed: (speed: number) => void;
  setQueue: (queue: string[]) => void;
  reset: () => void;
}

type PlaybackStore = PlaybackState & PlaybackActions;

const initialState: PlaybackState = {
  currentVerseId: null,
  speakingStatus: 'idle',
  speed: DEFAULT_TTS_SPEED,
  queue: [],
};

export const usePlaybackStore = create<PlaybackStore>()((set) => ({
  ...initialState,

  setCurrentVerse: (verseId) => set({ currentVerseId: verseId }),
  setSpeakingStatus: (status) => set({ speakingStatus: status }),
  setSpeed: (speed) => set({ speed }),
  setQueue: (queue) => set({ queue }),
  reset: () => set(initialState),
}));
