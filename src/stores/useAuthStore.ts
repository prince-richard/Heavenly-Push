import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  authMethod: 'google' | 'guest' | null;
  user: AuthUser | null;
}

interface AuthActions {
  signInWithGoogle: (user: AuthUser) => void;
  continueAsGuest: () => void;
  signOut: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      authMethod: null,
      user: null,

      signInWithGoogle: (user) =>
        set({
          isAuthenticated: true,
          authMethod: 'google',
          user,
        }),

      continueAsGuest: () =>
        set({
          isAuthenticated: true,
          authMethod: 'guest',
          user: { displayName: 'Guest', email: null, photoUrl: null },
        }),

      signOut: () =>
        set({
          isAuthenticated: false,
          authMethod: null,
          user: null,
        }),
    }),
    {
      name: 'heavenly-push-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        authMethod: state.authMethod,
        user: state.user,
      }),
    }
  )
);
