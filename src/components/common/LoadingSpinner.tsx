import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({ message, size = 'large' }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const displayMessage = message ?? t('common.loading');

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      t('accessibility.loadingContent')
    );
  }, [t]);

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={displayMessage}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size={size} color={colors.accent} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {displayMessage}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  message: {
    fontSize: 16,
    marginTop: 16,
  },
});
