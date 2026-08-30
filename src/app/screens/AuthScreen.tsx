import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAccessibility } from '@/hooks/useAccessibility';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import {
  GOOGLE_OAUTH_REDIRECT_PATH,
  getGoogleWebClientId,
  getGoogleWebRedirectUri,
} from '@/constants/auth';

function signInFromGoogleIdToken(
  idToken: string,
  signInWithGoogle: (user: {
    displayName: string;
    email: string | null;
    photoUrl: string | null;
  }) => void
) {
  const payload = JSON.parse(atob(idToken.split('.')[1]));
  signInWithGoogle({
    displayName: payload.name ?? payload.email ?? 'User',
    email: payload.email ?? null,
    photoUrl: payload.picture ?? null,
  });
}

export function AuthScreen() {
  const { colors } = useAccessibility();
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web: full-window redirect returns here with #id_token=... (popup flow would need
  // WebBrowser.maybeCompleteAuthSession() on /oauth, which we do not use).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const raw = window.location.hash;
    if (!raw || raw.length < 2) return;

    const params = new URLSearchParams(raw.startsWith('#') ? raw.slice(1) : raw);
    const stripHashFromUrl = () => {
      const { pathname, search } = window.location;
      const next =
        pathname === GOOGLE_OAUTH_REDIRECT_PATH ? '/' : `${pathname}${search}`;
      window.history.replaceState(null, '', next);
    };

    const oauthError = params.get('error');
    if (oauthError) {
      stripHashFromUrl();
      setError(
        oauthError === 'access_denied'
          ? 'Sign in was cancelled. Try again or continue as guest.'
          : 'Google sign in failed. You can continue as guest.'
      );
      return;
    }

    const idToken = params.get('id_token');
    if (!idToken) return;

    stripHashFromUrl();

    try {
      signInFromGoogleIdToken(idToken, signInWithGoogle);
    } catch (e) {
      console.error('Google OAuth return handling error:', e);
      setError('Google sign in failed. You can continue as guest.');
    }
  }, [signInWithGoogle]);

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clientId = Platform.select({
        web: getGoogleWebClientId(),
        ios: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
        android: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
        default: '',
      });

      const redirectUri =
        Platform.OS === 'web'
          ? getGoogleWebRedirectUri()
          : (
              await import('expo-auth-session')
            ).makeRedirectUri({
              path: GOOGLE_OAUTH_REDIRECT_PATH.replace(/^\//, ''),
              scheme: 'heavenlypush',
            });

      if (!redirectUri || !clientId) {
        setError('Google sign in is not configured for this platform.');
        return;
      }

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=token+id_token&` +
        `scope=${encodeURIComponent('openid profile email')}&` +
        `nonce=${Date.now()}`;

      if (Platform.OS === 'web') {
        window.location.assign(authUrl);
        return;
      }

      const { openAuthSessionAsync } = await import('expo-web-browser');
      const result = await openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const params = new URLSearchParams(result.url.split('#')[1] ?? '');
        const idToken = params.get('id_token');

        if (idToken) {
          signInFromGoogleIdToken(idToken, signInWithGoogle);
          return;
        }
      }

      setError('Sign in was cancelled. Try again or continue as guest.');
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Google sign in failed. You can continue as guest.');
    } finally {
      setLoading(false);
    }
  }, [signInWithGoogle]);

  const handleGuest = useCallback(() => {
    continueAsGuest();
  }, [continueAsGuest]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Branding */}
        <View style={styles.branding}>
          <Ionicons name="book" size={72} color={colors.accent} />
          <Text style={[styles.appName, { color: colors.text }]}>Heavenly Push</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Your voice-first Bible companion
          </Text>
        </View>

        {/* Auth buttons */}
        <View style={styles.buttons}>
          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          )}

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={({ pressed }) => [
              styles.googleButton,
              {
                backgroundColor: '#4285F4',
                opacity: pressed || loading ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-google" size={22} color="#fff" />
                <Text style={styles.googleText}>Sign in with Google</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleGuest}
            disabled={loading}
            style={({ pressed }) => [
              styles.guestButton,
              {
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue as guest"
          >
            <Ionicons name="person-outline" size={22} color={colors.text} />
            <Text style={[styles.guestText, { color: colors.text }]}>
              Continue as Guest
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 60,
    gap: 12,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
  },
  buttons: {
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: MIN_TOUCH_SIZE,
  },
  googleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: MIN_TOUCH_SIZE,
  },
  guestText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
