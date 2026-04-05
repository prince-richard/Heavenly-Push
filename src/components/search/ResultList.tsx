import React, { useEffect } from 'react';
import { FlatList, AccessibilityInfo, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SearchResult, BibleVerse } from '@/types/models';
import { VerseCard } from '@/components/verse/VerseCard';

interface ResultListProps {
  results: SearchResult[];
  onVersePress: (verse: BibleVerse) => void;
}

export function ResultList({ results, onVersePress }: ResultListProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (results.length > 0) {
      AccessibilityInfo.announceForAccessibility(
        t('search.resultsCount', { count: results.length })
      );
    }
  }, [results.length, t]);

  return (
    <FlatList
      data={results}
      keyExtractor={(item) => item.verse.id}
      renderItem={({ item }) => (
        <VerseCard verse={item.verse} onPress={onVersePress} />
      )}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
});
