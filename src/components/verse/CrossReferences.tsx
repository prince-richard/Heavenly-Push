import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/common/SectionHeader';
import { VerseCard } from './VerseCard';
import type { BibleVerse } from '@/types/models';
import { useDatabase } from '@/contexts/DatabaseContext';
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
  const db = useDatabase();
  const [relatedVerses, setRelatedVerses] = useState<BibleVerse[]>([]);

  useEffect(() => {
    const refIds = crossReferencesMap[verseId];
    if (!refIds || refIds.length === 0) {
      setRelatedVerses([]);
      return;
    }

    async function loadRefs() {
      try {
        const repo = new VerseRepository(db);
        const verses: BibleVerse[] = [];
        for (const id of refIds) {
          const v = await repo.getById(id);
          if (v) verses.push(v);
        }
        setRelatedVerses(verses);
      } catch (error) {
        console.error('CrossReferences load error:', error);
        setRelatedVerses([]);
      }
    }

    void loadRefs();
  }, [db, verseId]);

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
