import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { HighContrastToggle } from '@/components/settings/HighContrastToggle';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 24,
          }}
          accessibilityRole="header"
        >
          {t('settings.title')}
        </Text>

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: colors.accent,
              marginBottom: 12,
            }}
            accessibilityRole="header"
          >
            {t('settings.appearance')}
          </Text>
          <HighContrastToggle />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: colors.accent,
              marginBottom: 12,
            }}
            accessibilityRole="header"
          >
            {t('settings.audio')}
          </Text>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>
            Audio settings will appear here
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
