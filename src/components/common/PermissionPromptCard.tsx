import React from 'react';
import { View, Text, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/hooks/useAccessibility';
import { PrimaryButton } from './PrimaryButton';

interface PermissionPromptCardProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel: string;
  onAction?: () => void;
}

export function PermissionPromptCard({
  icon = 'shield-checkmark-outline',
  title,
  message,
  actionLabel,
  onAction,
}: PermissionPromptCardProps) {
  const { colors } = useAccessibility();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (Platform.OS !== 'web') {
      Linking.openSettings();
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      accessible={true}
      accessibilityLabel={`${title}. ${message}`}
    >
      <Ionicons
        name={icon}
        size={40}
        color={colors.accent}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
      <PrimaryButton
        title={actionLabel}
        onPress={handleAction}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    margin: 16,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  button: {
    minWidth: 200,
  },
});
