import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FavoriteEntry {
  reference: string;      // "John 3:16"
  englishText: string;    // cached English verse text
  tamilText: string;      // cached Tamil verse text (may be empty)
  snippet: string;        // short display snippet
  language: 'en' | 'ta';  // language when saved
  savedAt: number;        // epoch ms
}

interface FavoritesState {
  favorites: FavoriteEntry[];
  loading: boolean;
}

interface FavoritesActions {
  add: (entry: FavoriteEntry) => void;
  remove: (reference: string) => void;
  clear: () => void;
  isFavorite: (reference: string) => boolean;
  getByReference: (reference: string) => FavoriteEntry | undefined;
  setLoading: (loading: boolean) => void;
}

type FavoritesStore = FavoritesState & FavoritesActions;

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      loading: false,

      add: (entry) =>
        set((state) => {
          if (state.favorites.some((f) => f.reference === entry.reference)) {
            return state;
          }
          return { favorites: [entry, ...state.favorites] };
        }),

      remove: (reference) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.reference !== reference),
        })),

      clear: () => set({ favorites: [] }),

      isFavorite: (reference) =>
        get().favorites.some((f) => f.reference === reference),

      getByReference: (reference) =>
        get().favorites.find((f) => f.reference === reference),

      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'heavenly-push-favorites',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
);
