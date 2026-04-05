import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';

export function VerseDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <View style={{ flex: 1, padding: 16 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 16,
          }}
          accessibilityRole="header"
        >
          {t('verse.title')}
        </Text>
        <Text style={{ fontSize: 18, color: colors.textSecondary }}>
          Verse content will appear here
        </Text>
      </View>
    </SafeAreaView>
  );
}
