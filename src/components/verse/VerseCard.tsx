import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { BibleVerse } from '@/types/models';

interface VerseCardProps {
  verse: BibleVerse;
  onPress: (verse: BibleVerse) => void;
  showThemeTags?: boolean;
}

export function VerseCard({
  verse,
  onPress,
  showThemeTags = true,
}: VerseCardProps) {
  const { colors } = useAccessibility();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);

  const reference = `${primaryLanguage === 'ta' ? verse.bookNameTa : verse.bookNameEn} ${verse.chapter}:${verse.verse}`;
  const text =
    primaryLanguage === 'ta'
      ? verse.textTa ?? verse.textEn ?? ''
      : verse.textEn ?? verse.textTa ?? '';

  // Truncate to ~120 chars for snippet
  const snippet =
    text.length > 120 ? text.substring(0, 120).trim() + '...' : text;

  return (
    <Pressable
      onPress={() => onPress(verse)}
      accessibilityRole="button"
      accessibilityLabel={`${reference}. ${snippet}`}
      accessibilityHint="Double tap to view full verse"
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.reference, { color: colors.accent }]}>
        {reference}
      </Text>
      <Text
        style={[styles.text, { color: colors.text }]}
        numberOfLines={3}
      >
        {snippet}
      </Text>
      {showThemeTags && verse.themeTags.length > 0 && (
        <View style={styles.tagsRow}>
          {verse.themeTags.slice(0, 3).map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            >
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: MIN_TOUCH_SIZE,
  },
  reference: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
