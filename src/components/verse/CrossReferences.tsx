import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/common/SectionHeader';
import { VerseCard } from './VerseCard';
import type { BibleVerse } from '@/types/models';
import { getDatabase } from '@/db/database';
import { VerseRepository } from '@/db/repositories/VerseRepository';
import crossReferencesData from '@/data/seed/cross-references.json';

interface CrossReferencesProps {
  verseId: string;
  onVersePress: (verse: BibleVerse) => void;
}

const crossReferencesMap = crossReferencesData as Record<string, string[]>;

export function CrossReferences({
  verseId,
  onVersePress,
}: CrossReferencesProps) {
  const { t } = useTranslation();
  const [relatedVerses, setRelatedVerses] = useState<BibleVerse[]>([]);

  useEffect(() => {
    const refIds = crossReferencesMap[verseId];
    if (!refIds || refIds.length === 0) {
      setRelatedVerses([]);
      return;
    }

    try {
      const db = getDatabase();
      const repo = new VerseRepository(db);
      const verses = refIds
        .map((id) => repo.getById(id))
        .filter((v): v is BibleVerse => v !== null);
      setRelatedVerses(verses);
    } catch {
      setRelatedVerses([]);
    }
  }, [verseId]);

  if (relatedVerses.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SectionHeader title={t('verse.crossReferences')} />
      {relatedVerses.map((verse) => (
        <VerseCard
          key={verse.id}
          verse={verse}
          onPress={onVersePress}
          showThemeTags={false}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
});
