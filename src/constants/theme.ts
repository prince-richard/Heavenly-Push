export interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  accent: string;
  link: string;
  error: string;
  success: string;
  border: string;
  card: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  inputBackground: string;
  placeholder: string;
}

export const darkHighContrast: ThemeColors = {
  background: '#000000',
  text: '#FFFFFF',
  textSecondary: '#E0E0E0',
  accent: '#FFD700',
  link: '#00BFFF',
  error: '#FF6B6B',
  success: '#00FF7F',
  border: '#FFFFFF',
  card: '#1A1A1A',
  tabBar: '#0A0A0A',
  tabBarActive: '#FFD700',
  tabBarInactive: '#888888',
  inputBackground: '#1A1A1A',
  placeholder: '#888888',
};

export const lightHighContrast: ThemeColors = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#333333',
  accent: '#B8860B',
  link: '#0000EE',
  error: '#CC0000',
  success: '#006400',
  border: '#000000',
  card: '#F5F5F5',
  tabBar: '#FFFFFF',
  tabBarActive: '#1E40AF',
  tabBarInactive: '#666666',
  inputBackground: '#F0F0F0',
  placeholder: '#666666',
};

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
  sm: 16,
  base: 18,
  lg: 22,
  xl: 26,
  '2xl': 32,
} as const;

export function getTheme(highContrast: boolean): ThemeColors {
  return highContrast ? darkHighContrast : lightHighContrast;
}
