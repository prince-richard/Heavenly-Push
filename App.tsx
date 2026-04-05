import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/i18n';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import { linking } from '@/app/navigation/linking';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function App() {
  const highContrastMode = useSettingsStore((s) => s.highContrastMode);

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <RootNavigator />
        <StatusBar style={highContrastMode ? 'light' : 'dark'} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
