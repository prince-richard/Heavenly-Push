import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SectionHeader } from '@/components/common/SectionHeader';
import summariesData from '@/data/seed/summaries.json';

interface ChapterSummaryProps {
  bookCode: string;
  chapter: number;
}

interface SummaryEntry {
  en: string;
  ta: string;
}

const summariesMap = summariesData as Record<string, SummaryEntry>;

export function ChapterSummary({ bookCode, chapter }: ChapterSummaryProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);

  const key = `${bookCode}-${chapter}`;
  const summary = summariesMap[key];

  if (!summary) {
    return null;
  }

  const text = primaryLanguage === 'ta' ? summary.ta ?? summary.en : summary.en;

  return (
    <View style={styles.container}>
      <SectionHeader title={t('verse.chapterSummary')} />
      <Text
        style={[styles.text, { color: colors.textSecondary }]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`Chapter summary: ${text}`}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});
