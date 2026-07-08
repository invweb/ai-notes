import { useColorScheme } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  success: string;
  border: string;
  borderLight: string;
  tagBg: string;
  tagText: string;
}

export const lightColors: ThemeColors = {
  background: '#f5f5f7',
  surface: '#ffffff',
  surfaceSecondary: '#e8e8ed',
  text: '#1a1a1a',
  textSecondary: '#666666',
  textTertiary: '#999999',
  primary: '#007AFF',
  success: '#34C759',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  tagBg: '#e8f4fd',
  tagText: '#007AFF',
};

export const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#1c1c1e',
  surfaceSecondary: '#2c2c2e',
  text: '#ffffff',
  textSecondary: '#8e8e93',
  textTertiary: '#636366',
  primary: '#0a84ff',
  success: '#30d158',
  border: '#38383a',
  borderLight: '#2c2c2e',
  tagBg: '#0a84ff20',
  tagText: '#0a84ff',
};

export type ThemeMode = 'system' | 'light' | 'dark';

export function useTheme(mode: ThemeMode = 'system'): ThemeColors {
  const systemScheme = useColorScheme();
  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  return isDark ? darkColors : lightColors;
}
