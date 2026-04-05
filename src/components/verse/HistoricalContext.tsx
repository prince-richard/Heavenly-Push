import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SectionHeader } from '@/components/common/SectionHeader';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import historicalData from '@/data/seed/historical-context.json';

interface HistoricalContextProps {
  verseId: string;
  bookCode: string;
}

interface ContextEntry {
  en: string;
  ta: string;
}

const contextMap = historicalData as Record<string, ContextEntry>;

export function HistoricalContext({ verseId, bookCode }: HistoricalContextProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const [expanded, setExpanded] = useState(false);

  // Try verse-specific first, then book-level
  const entry = contextMap[verseId] ?? contextMap[bookCode];

  if (!entry) {
    return null;
  }

  const text = primaryLanguage === 'ta' ? entry.ta ?? entry.en : entry.en;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={t('verse.historicalContext')}
        accessibilityHint={expanded ? 'Collapse section' : 'Expand section'}
        accessibilityState={{ expanded }}
        style={styles.header}
      >
        <SectionHeader title={t('verse.historicalContext')} />
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.accent}
        />
      </Pressable>

      {expanded && (
        <Text
          style={[styles.text, { color: colors.textSecondary }]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Historical context: ${text}`}
        >
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_SIZE,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
});
