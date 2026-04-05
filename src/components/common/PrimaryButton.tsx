import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useAccessibility } from '@/hooks/useAccessibility';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
}: PrimaryButtonProps) {
  const { colors } = useAccessibility();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled
            ? colors.placeholder
            : pressed
            ? colors.accent
            : colors.tabBarActive,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.background },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
  },
});
