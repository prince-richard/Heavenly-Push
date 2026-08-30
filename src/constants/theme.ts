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
  halo: string;
  gold: string;
  heroGradient: readonly [string, string, string];
  backdropGradient: readonly [string, string];
  glass: string;
  glassBorder: string;
  angelGlow: string;
  chatUser: string;
  chatAssistant: string;
}

/**
 * Dark theme — Rich purple background with white text and violet accents.
 */
export const darkPurple: ThemeColors = {
  background: '#1A0533',
  text: '#FFFFFF',
  textSecondary: '#B8A5D6',
  accent: '#A855F7',
  accentLight: '#D8B4FE',
  accentDark: '#7E22CE',
  link: '#C084FC',
  error: '#F87171',
  success: '#4ADE80',
  border: 'rgba(168, 85, 247, 0.2)',
  card: 'rgba(255, 255, 255, 0.06)',
  cardElevated: 'rgba(255, 255, 255, 0.1)',
  tabBar: 'rgba(26, 5, 51, 0.95)',
  tabBarActive: '#A855F7',
  tabBarInactive: 'rgba(184, 165, 214, 0.5)',
  inputBackground: 'rgba(255, 255, 255, 0.08)',
  placeholder: 'rgba(184, 165, 214, 0.6)',
  gradientStart: '#2D0B56',
  gradientEnd: '#A855F7',
  halo: 'rgba(168, 85, 247, 0.25)',
  gold: '#D8B4FE',
  heroGradient: ['rgba(45, 11, 86, 0.9)', 'rgba(126, 34, 206, 0.4)', 'rgba(168, 85, 247, 0.15)'] as const,
  backdropGradient: ['#1A0533', '#2D0B56'] as const,
  glass: 'rgba(255, 255, 255, 0.07)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  angelGlow: 'rgba(168, 85, 247, 0.3)',
  chatUser: 'rgba(168, 85, 247, 0.2)',
  chatAssistant: 'rgba(255, 255, 255, 0.06)',
};

/**
 * Light theme — Clean white background with purple accents.
 */
export const lightPurple: ThemeColors = {
  background: '#FFFFFF',
  text: '#1E1033',
  textSecondary: '#6B5B8A',
  accent: '#7C3AED',
  accentLight: '#EDE9FE',
  accentDark: '#5B21B6',
  link: '#6D28D9',
  error: '#DC2626',
  success: '#16A34A',
  border: 'rgba(124, 58, 237, 0.12)',
  card: '#F5F0FF',
  cardElevated: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarActive: '#7C3AED',
  tabBarInactive: '#A3A3A3',
  inputBackground: '#F5F0FF',
  placeholder: '#A3A3A3',
  gradientStart: '#7C3AED',
  gradientEnd: '#DDD6FE',
  halo: 'rgba(124, 58, 237, 0.1)',
  gold: '#7C3AED',
  heroGradient: ['#FFFFFF', '#F5F0FF', '#EDE9FE'] as const,
  backdropGradient: ['#FFFFFF', '#F5F0FF'] as const,
  glass: '#F5F0FF',
  glassBorder: 'rgba(124, 58, 237, 0.12)',
  angelGlow: 'rgba(124, 58, 237, 0.15)',
  chatUser: 'rgba(124, 58, 237, 0.1)',
  chatAssistant: '#F5F0FF',
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
