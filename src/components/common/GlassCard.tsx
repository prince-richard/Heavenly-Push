import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAccessibility } from '@/hooks/useAccessibility';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

/**
 * Frosted glass card with translucent background and subtle border.
 * On dark mode: white at ~6% opacity with faint white border.
 * On light mode: purple tint at ~4% with subtle purple border.
 */
export function GlassCard({ children, style, elevated = false }: GlassCardProps) {
  const { colors } = useAccessibility();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: elevated ? colors.cardElevated : colors.glass,
          borderColor: colors.glassBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
