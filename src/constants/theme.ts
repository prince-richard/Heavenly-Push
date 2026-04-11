export interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  link: string;
  error: string;
  success: string;
  border: string;
  card: string;
  cardElevated: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  inputBackground: string;
  placeholder: string;
  gradientStart: string;
  gradientEnd: string;
  /** Soft halo color used behind hero elements (matches accent at low alpha). */
  halo: string;
  /** Warm gold reserved for verse references and divine-touch accents. */
  gold: string;
  /** Three-stop gradient used for the hero card background. */
  heroGradient: readonly [string, string, string];
  /** Two-stop gradient used for the screen backdrop. */
  backdropGradient: readonly [string, string];
}

/**
 * "Heavenly night" — deep cosmic indigo melting into violet, with warm
 * gold accents reminiscent of starlight on cathedral glass.
 */
export const darkPurple: ThemeColors = {
  background: '#08061A',
  text: '#F5F1FF',
  textSecondary: '#B6ABDB',
  accent: '#C4B5FD',
  accentLight: '#E9DEFF',
  accentDark: '#7C3AED',
  link: '#E9DEFF',
  error: '#FB7185',
  success: '#5EE7A8',
  border: '#2A1F55',
  card: '#160F38',
  cardElevated: '#1E1647',
  tabBar: '#0A0722',
  tabBarActive: '#FCD34D', // gold for active tab — feels divine
  tabBarInactive: '#6B5F8A',
  inputBackground: '#160F38',
  placeholder: '#6B5F8A',
  gradientStart: '#3A1F8C',
  gradientEnd: '#A78BFA',
  halo: 'rgba(196, 181, 253, 0.18)',
  gold: '#FCD34D',
  heroGradient: ['#1E1247', '#3A1F8C', '#5B21B6'] as const,
  backdropGradient: ['#08061A', '#160F38'] as const,
};

/**
 * "Heavenly dawn" — soft cream sky with violet edges and warm gold,
 * for users who prefer a brighter palette.
 */
export const lightPurple: ThemeColors = {
  background: '#FBF8FF',
  text: '#1A0F3D',
  textSecondary: '#5B5278',
  accent: '#7C3AED',
  accentLight: '#EDE9FE',
  accentDark: '#4C1D95',
  link: '#6D28D9',
  error: '#DC2626',
  success: '#16A34A',
  border: '#E4DCF5',
  card: '#F5EFFF',
  cardElevated: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarActive: '#B45309', // warm gold
  tabBarInactive: '#9CA3AF',
  inputBackground: '#F5EFFF',
  placeholder: '#9CA3AF',
  gradientStart: '#7C3AED',
  gradientEnd: '#C4B5FD',
  halo: 'rgba(124, 58, 237, 0.12)',
  gold: '#B45309',
  heroGradient: ['#FFFFFF', '#F5EFFF', '#EDE9FE'] as const,
  backdropGradient: ['#FBF8FF', '#F5EFFF'] as const,
};

// Backwards-compatible aliases
export const darkHighContrast = darkPurple;
export const lightHighContrast = lightPurple;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const fontSizes = {
  sm: 14,
  base: 16,
  md: 18,
  lg: 22,
  xl: 26,
  '2xl': 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export function getTheme(dark: boolean): ThemeColors {
  return dark ? darkPurple : lightPurple;
}
