import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/i18n';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import { linking } from '@/app/navigation/linking';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { AuthScreen } from '@/app/screens/AuthScreen';

export default function App() {
  const highContrastMode = useSettingsStore((s) => s.highContrastMode);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <AuthScreen />
        <StatusBar style={highContrastMode ? 'light' : 'dark'} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <NavigationContainer linking={linking}>
          <RootNavigator />
          <StatusBar style={highContrastMode ? 'light' : 'dark'} />
        </NavigationContainer>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
