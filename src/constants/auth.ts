/** Path segment for Google OAuth redirect (must match Authorized redirect URIs in Google Cloud). */
export const GOOGLE_OAUTH_REDIRECT_PATH = '/oauth';

const DEFAULT_GOOGLE_WEB_CLIENT_ID =
  '19249620763-4brri96gmareiiu0q80888kovb945cde.apps.googleusercontent.com';

export function getGoogleWebClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() || DEFAULT_GOOGLE_WEB_CLIENT_ID;
}

/** Web redirect URI sent to Google — must match Console exactly (origin + /oauth). */
export function getGoogleWebRedirectUri(): string {
  if (typeof window === 'undefined') return '';

  const override = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI?.trim();
  if (override) return override.replace(/\/$/, '');

  const url = new URL(GOOGLE_OAUTH_REDIRECT_PATH, window.location.origin);
  return url.href.replace(/\/$/, '');
}
