import React, { useCallback, useEffect } from 'react';
import {
  FlatList,
  View,
  Text,
  Pressable,
  AccessibilityInfo,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { SearchResult, BibleVerse } from '@/types/models';

interface ResultListProps {
  results: SearchResult[];
  onVersePress: (verse: BibleVerse) => void;
}

export function ResultList({ results, onVersePress }: ResultListProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);

  useEffect(() => {
    if (results.length > 0) {
      AccessibilityInfo.announceForAccessibility(
        t('search.resultsCount', { count: results.length }),
      );
    }
  }, [results.length, t]);

  const renderItem = useCallback(
    ({ item, index }: { item: SearchResult; index: number }) => {
      const { verse } = item;
      const reference = `${
        primaryLanguage === 'ta' ? verse.bookNameTa : verse.bookNameEn
      } ${verse.chapter}:${verse.verse}`;
      const text =
        primaryLanguage === 'ta'
          ? (verse.textTa ?? verse.textEn ?? '')
          : (verse.textEn ?? verse.textTa ?? '');

      const snippet =
        text.length > 140 ? text.substring(0, 140).trim() + '...' : text;

      const isApiResult = item.matchType === 'api';

      return (
        <Pressable
          onPress={() => onVersePress(verse)}
          accessibilityRole="button"
          accessibilityLabel={`${reference}. ${snippet}`}
          accessibilityHint="Double tap to view full verse"
          style={({ pressed }) => [
            styles.resultCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.88 : 1,
              ...Platform.select({
                ios: {
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                },
                android: { elevation: 2 },
                default: {},
              }),
            },
          ]}
        >
          {/* Reference row */}
          <View style={styles.referenceRow}>
            <Text style={[styles.reference, { color: colors.accent }]}>
              {reference}
            </Text>
            {isApiResult && (
              <View
                style={[
                  styles.apiBadge,
                  { backgroundColor: colors.accent + '20' },
                ]}
              >
                <Ionicons
                  name="cloud-outline"
                  size={11}
                  color={colors.accent}
                />
                <Text
                  style={[styles.apiBadgeText, { color: colors.accent }]}
                >
                  Online
                </Text>
              </View>
            )}
          </View>

          {/* Verse text */}
          <Text
            style={[styles.verseText, { color: colors.text }]}
            numberOfLines={3}
          >
            {snippet}
          </Text>

          {/* Theme tags */}
          {verse.themeTags.length > 0 && (
            <View style={styles.tagsRow}>
              {verse.themeTags.slice(0, 3).map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: colors.accent + '12',
                      borderColor: colors.accent + '30',
                    },
                  ]}
                >
                  <Text
                    style={[styles.tagText, { color: colors.accent }]}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Chevron */}
          <View style={styles.chevronContainer}>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.placeholder}
            />
          </View>
        </Pressable>
      );
    },
    [colors, primaryLanguage, onVersePress],
  );

  return (
    <View style={styles.listWrapper}>
      <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
        {t('search.resultsCount', { count: results.length })}
      </Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.verse.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listWrapper: {
    flex: 1,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
  },
  list: {
    paddingBottom: 16,
  },
  resultCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    minHeight: MIN_TOUCH_SIZE,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reference: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  apiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  apiBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  verseText: {
    fontSize: 15,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chevronContainer: {
    position: 'absolute',
    right: 14,
    top: 16,
  },
});
