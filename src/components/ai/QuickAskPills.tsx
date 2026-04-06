import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

interface QuickAskPillsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
}

const SUGGESTION_KEYS = [
  'ai.suggest.explain',
  'ai.suggest.lesson',
  'ai.suggest.summarize',
  'ai.suggest.context',
  'ai.suggest.tamil',
] as const;

export function QuickAskPills({ onSelect, disabled = false }: QuickAskPillsProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityRole="menu"
      accessibilityLabel={t('ai.title')}
    >
      {SUGGESTION_KEYS.map((key) => {
        const label = t(key);
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(label)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint="Tap to ask this question"
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: pressed
                  ? colors.accent
                  : colors.inputBackground,
                borderColor: colors.border,
                opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: colors.text },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: 8,
  },
  pill: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
