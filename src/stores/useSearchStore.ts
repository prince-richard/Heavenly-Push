import { create } from 'zustand';
import type { SearchResult, SearchHistoryItem } from '@/types/models';

interface SearchState {
  query: string;
  results: SearchResult[];
  recentHistory: SearchHistoryItem[];
  loading: boolean;
  error: string | null;
}

interface SearchActions {
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setRecentHistory: (history: SearchHistoryItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

type SearchStore = SearchState & SearchActions;

const initialState: SearchState = {
  query: '',
  results: [],
  recentHistory: [],
  loading: false,
  error: null,
};

export const useSearchStore = create<SearchStore>()((set) => ({
  ...initialState,

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setRecentHistory: (history) => set({ recentHistory: history }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
