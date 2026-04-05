import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/hooks/useAccessibility';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

interface IconButtonAccessibleProps {
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  size?: number;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function IconButtonAccessible({
  iconName,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  size = 28,
  color,
  disabled = false,
  style,
}: IconButtonAccessibleProps) {
  const { colors } = useAccessibility();
  const iconColor = color ?? colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { opacity: pressed ? 0.6 : disabled ? 0.4 : 1 },
        style,
      ]}
    >
      <Ionicons name={iconName} size={size} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
