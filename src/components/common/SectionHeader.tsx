import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useAccessibility } from '@/hooks/useAccessibility';

interface SectionHeaderProps {
  title: string;
  style?: TextStyle;
}

export function SectionHeader({ title, style }: SectionHeaderProps) {
  const { colors } = useAccessibility();

  return (
    <Text
      accessibilityRole="header"
      style={[styles.header, { color: colors.accent }, style]}
    >
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
});
