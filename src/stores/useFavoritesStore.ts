import { create } from 'zustand';

interface FavoritesState {
  favoriteIds: Set<string>;
  loading: boolean;
}

interface FavoritesActions {
  add: (verseId: string) => void;
  remove: (verseId: string) => void;
  setFavorites: (ids: string[]) => void;
  isFavorite: (verseId: string) => boolean;
  setLoading: (loading: boolean) => void;
}

type FavoritesStore = FavoritesState & FavoritesActions;

export const useFavoritesStore = create<FavoritesStore>()((set, get) => ({
  favoriteIds: new Set<string>(),
  loading: false,

  add: (verseId) =>
    set((state) => ({
      favoriteIds: new Set([...state.favoriteIds, verseId]),
    })),

  remove: (verseId) =>
    set((state) => {
      const next = new Set(state.favoriteIds);
      next.delete(verseId);
      return { favoriteIds: next };
    }),

  setFavorites: (ids) => set({ favoriteIds: new Set(ids) }),

  isFavorite: (verseId) => get().favoriteIds.has(verseId),

  setLoading: (loading) => set({ loading }),
}));
