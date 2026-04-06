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
}

export const darkPurple: ThemeColors = {
  background: '#0F0A1F',
  text: '#F0EDFF',
  textSecondary: '#B8B0D6',
  accent: '#A78BFA',
  accentLight: '#C4B5FD',
  accentDark: '#7C3AED',
  link: '#C4B5FD',
  error: '#F87171',
  success: '#4ADE80',
  border: '#2D2550',
  card: '#1A1333',
  cardElevated: '#241C42',
  tabBar: '#0F0A1F',
  tabBarActive: '#A78BFA',
  tabBarInactive: '#6B5F8A',
  inputBackground: '#1A1333',
  placeholder: '#6B5F8A',
  gradientStart: '#7C3AED',
  gradientEnd: '#A78BFA',
};

export const lightPurple: ThemeColors = {
  background: '#FAF8FF',
  text: '#1A1030',
  textSecondary: '#5B5278',
  accent: '#7C3AED',
  accentLight: '#EDE9FE',
  accentDark: '#5B21B6',
  link: '#6D28D9',
  error: '#DC2626',
  success: '#16A34A',
  border: '#E4DCF5',
  card: '#F3EEFF',
  cardElevated: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarActive: '#7C3AED',
  tabBarInactive: '#9CA3AF',
  inputBackground: '#F3EEFF',
  placeholder: '#9CA3AF',
  gradientStart: '#7C3AED',
  gradientEnd: '#A78BFA',
};

// Keep old names as aliases for backward compatibility
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
