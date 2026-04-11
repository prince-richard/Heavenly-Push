import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { SupportedLanguage } from '@/types/models';

/**
 * Per-user preference sync.
 *
 * The base settings store is persisted globally (so the app remembers
 * basic prefs between cold starts even when logged out). On top of
 * that, we maintain a per-user preference blob keyed by the user's
 * email or auth method, so that:
 *
 *  1. When a user signs in, we restore THEIR language + theme.
 *  2. When they change those prefs, we save them under their key.
 *  3. When they sign out and another user signs in, that user gets
 *     their own prefs back.
 *
 * Stored under AsyncStorage as `heavenly-push-user-prefs:<key>`.
 */

interface UserPrefs {
  primaryLanguage?: SupportedLanguage;
  highContrastMode?: boolean;
  ttsSpeed?: number;
}

function userKey(email: string | null | undefined, method: string | null): string {
  if (email) return email.toLowerCase();
  if (method === 'guest') return 'guest';
  return 'anonymous';
}

function storageKey(key: string): string {
  return `heavenly-push-user-prefs:${key}`;
}

export function useUserPreferenceSync(): void {
  const authUser = useAuthStore((s) => s.user);
  const authMethod = useAuthStore((s) => s.authMethod);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const setLanguage = useSettingsStore((s) => s.setLanguage);

  // Track the currently hydrated user so we don't overwrite their prefs
  // before hydration completes.
  const hydratedKeyRef = useRef<string | null>(null);

  // Hydrate prefs whenever the logged-in user changes.
  useEffect(() => {
    if (!isAuthenticated) {
      hydratedKeyRef.current = null;
      return;
    }
    const key = userKey(authUser?.email, authMethod);
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey(key));
        if (cancelled) return;
        if (raw) {
          const prefs = JSON.parse(raw) as UserPrefs;
          const settings = useSettingsStore.getState();

          if (prefs.primaryLanguage && prefs.primaryLanguage !== settings.primaryLanguage) {
            setLanguage(prefs.primaryLanguage);
          }
          if (
            typeof prefs.highContrastMode === 'boolean' &&
            prefs.highContrastMode !== settings.highContrastMode
          ) {
            // Direct set rather than toggle to avoid race conditions.
            useSettingsStore.setState({ highContrastMode: prefs.highContrastMode });
          }
          if (
            typeof prefs.ttsSpeed === 'number' &&
            prefs.ttsSpeed !== settings.ttsSpeed
          ) {
            useSettingsStore.setState({ ttsSpeed: prefs.ttsSpeed });
          }
        }
      } catch {
        // Ignore corrupt blobs — fall back to global defaults.
      } finally {
        if (!cancelled) hydratedKeyRef.current = key;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authUser?.email, authMethod, setLanguage]);

  // Subscribe to settings changes and write them back under the
  // current user's key. Only writes after hydration is complete.
  useEffect(() => {
    if (!isAuthenticated) return;
    const key = userKey(authUser?.email, authMethod);

    const unsub = useSettingsStore.subscribe((state, prevState) => {
      // Only write once we've hydrated this specific user.
      if (hydratedKeyRef.current !== key) return;

      const changed =
        state.primaryLanguage !== prevState.primaryLanguage ||
        state.highContrastMode !== prevState.highContrastMode ||
        state.ttsSpeed !== prevState.ttsSpeed;

      if (!changed) return;

      const prefs: UserPrefs = {
        primaryLanguage: state.primaryLanguage,
        highContrastMode: state.highContrastMode,
        ttsSpeed: state.ttsSpeed,
      };

      AsyncStorage.setItem(storageKey(key), JSON.stringify(prefs)).catch(() => {
        // Best-effort — settings remain in the in-memory store.
      });
    });

    return unsub;
  }, [isAuthenticated, authUser?.email, authMethod]);
}
