import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { initializeDatabase } from '@/db/database';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useSearchStore } from '@/stores/useSearchStore';
import { FavoritesRepository } from '@/db/repositories/FavoritesRepository';
import { SearchHistoryRepository } from '@/db/repositories/SearchHistoryRepository';

interface DatabaseContextValue {
  db: SQLiteDatabase | null;
  isReady: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
  error: null,
});

/**
 * Hook to get the database instance from context.
 * Throws if the database is not yet initialized.
 */
export function useDatabase(): SQLiteDatabase {
  const { db } = useContext(DatabaseContext);
  if (!db) {
    throw new Error('Database not initialized. Ensure DatabaseProvider has mounted.');
  }
  return db;
}

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [state, setState] = useState<DatabaseContextValue>({
    db: null,
    isReady: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const db = await initializeDatabase();

        if (cancelled) return;

        // Load favorites from DB into Zustand store
        const favRepo = new FavoritesRepository(db);
        const favs = await favRepo.getAll();
        useFavoritesStore.getState().setFavorites(favs.map((f) => f.verseId));

        // Load recent search history into Zustand store
        const histRepo = new SearchHistoryRepository(db);
        const recent = await histRepo.getRecent(10);
        useSearchStore.getState().setRecentHistory(recent);

        if (!cancelled) {
          setState({ db, isReady: true, error: null });
        }
      } catch (err) {
        console.error('Database initialization failed:', err);
        if (!cancelled) {
          setState({
            db: null,
            isReady: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.error) {
    const isAccessHandleError = state.error.includes('Access Handle') || state.error.includes('createSyncAccessHandle');
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Database Error</Text>
        <Text style={styles.errorMessage}>
          {isAccessHandleError
            ? 'Another tab is using the database. Please close all other tabs with this app and reload this page.'
            : state.error}
        </Text>
      </View>
    );
  }

  if (!state.isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={state}>
      {children}
    </DatabaseContext.Provider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  errorTitle: {
    color: '#ff4444',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorMessage: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
