import React, { useCallback, useState } from 'react';
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

export function AuthScreen() {
  const { colors } = useAccessibility();
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Dynamic import to avoid requiring expo-auth-session when not needed
      const { makeRedirectUri } = await import('expo-auth-session');
      const { openAuthSessionAsync } = await import('expo-web-browser');

      const redirectUri = makeRedirectUri({ preferLocalhost: Platform.OS === 'web' });

      // Google OAuth endpoint
      const clientId = Platform.select({
        web: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
        ios: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
        android: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
        default: '',
      });

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=token+id_token&` +
        `scope=${encodeURIComponent('openid profile email')}&` +
        `nonce=${Date.now()}`;

      const result = await openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        // Extract ID token from URL fragment
        const params = new URLSearchParams(result.url.split('#')[1]);
        const idToken = params.get('id_token');

        if (idToken) {
          // Decode JWT payload (no verification needed for local-only)
          const payload = JSON.parse(atob(idToken.split('.')[1]));
          signInWithGoogle({
            displayName: payload.name ?? payload.email ?? 'User',
            email: payload.email ?? null,
            photoUrl: payload.picture ?? null,
          });
          return;
        }
      }

      // If we get here, auth wasn't completed
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
