import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { IconButtonAccessible } from '@/components/common/IconButtonAccessible';
import { SectionHeader } from '@/components/common/SectionHeader';
import type { BibleVerse } from '@/types/models';

interface ContextNavigatorProps {
  previousVerses: BibleVerse[];
  nextVerses: BibleVerse[];
  onNavigateToVerse: (verseId: string) => void;
}

export function ContextNavigator({
  previousVerses,
  nextVerses,
  onNavigateToVerse,
}: ContextNavigatorProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);

  const allContextVerses = [...previousVerses, ...nextVerses];

  if (allContextVerses.length === 0) {
    return null;
  }

  const getVerseText = (verse: BibleVerse): string => {
    if (primaryLanguage === 'ta') {
      return verse.textTa ?? verse.textEn ?? '';
    }
    return verse.textEn ?? verse.textTa ?? '';
  };

  return (
    <View style={styles.container}>
      <SectionHeader title={t('verse.readContext')} />

      <View style={styles.navigationRow}>
        {previousVerses.length > 0 && (
          <IconButtonAccessible
            iconName="chevron-back"
            onPress={() =>
              onNavigateToVerse(previousVerses[previousVerses.length - 1].id)
            }
            accessibilityLabel="Previous verse"
            accessibilityHint="Navigate to the previous verse"
          />
        )}
        <View style={{ flex: 1 }} />
        {nextVerses.length > 0 && (
          <IconButtonAccessible
            iconName="chevron-forward"
            onPress={() => onNavigateToVerse(nextVerses[0].id)}
            accessibilityLabel="Next verse"
            accessibilityHint="Navigate to the next verse"
          />
        )}
      </View>

      {allContextVerses.map((verse) => (
        <View
          key={verse.id}
          style={[styles.contextVerse, { borderColor: colors.border }]}
          accessible={true}
          accessibilityLabel={`${verse.bookNameEn} ${verse.chapter}:${verse.verse}. ${getVerseText(verse)}`}
        >
          <Text style={[styles.verseRef, { color: colors.textSecondary }]}>
            {verse.chapter}:{verse.verse}
          </Text>
          <Text style={[styles.verseText, { color: colors.text }]}>
            {getVerseText(verse)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contextVerse: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
  },
  verseRef: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
});
