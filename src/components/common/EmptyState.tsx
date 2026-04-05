import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/hooks/useAccessibility';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'document-text-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useAccessibility();

  return (
    <View style={styles.container} accessible={true}>
      <Ionicons
        name={icon}
        size={64}
        color={colors.placeholder}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton
          title={actionLabel}
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
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
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  action: {
    marginTop: 8,
  },
});
