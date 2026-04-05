import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, AccessibilityInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { VerseCard } from '@/components/verse/VerseCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { IconButtonAccessible } from '@/components/common/IconButtonAccessible';
import type { RootStackParamList } from '@/types/navigation';
import type { BibleVerse } from '@/types/models';
import { useDatabase } from '@/contexts/DatabaseContext';
import { VerseRepository } from '@/db/repositories/VerseRepository';
import { FavoritesRepository } from '@/db/repositories/FavoritesRepository';

type FavNav = NativeStackNavigationProp<RootStackParamList>;

export function FavoritesScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const navigation = useNavigation<FavNav>();
  const db = useDatabase();
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const removeFavorite = useFavoritesStore((s) => s.remove);

  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorite verses
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function loadFavs() {
      try {
        const verseRepo = new VerseRepository(db);
        const ids = Array.from(favoriteIds);
        const loaded: BibleVerse[] = [];
        for (const id of ids) {
          const v = await verseRepo.getById(id);
          if (v) loaded.push(v);
        }
        if (!cancelled) setVerses(loaded);
      } catch (error) {
        console.error('FavoritesScreen load error:', error);
        if (!cancelled) setVerses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFavs();
    return () => { cancelled = true; };
  }, [db, favoriteIds]);

  const handleVersePress = useCallback(
    (verse: BibleVerse) => {
      navigation.navigate('VerseDetail', { verseId: verse.id });
    },
    [navigation]
  );

  const handleRemove = useCallback(
    (verseId: string) => {
      removeFavorite(verseId);

      // Also remove from DB
      async function removeFromDb() {
        try {
          const favRepo = new FavoritesRepository(db);
          await favRepo.remove(verseId);
        } catch (error) {
          console.error('FavoritesScreen remove error:', error);
        }
      }
      void removeFromDb();

      AccessibilityInfo.announceForAccessibility(
        t('favorites.remove')
      );
    },
    [db, removeFavorite, t]
  );

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['top']}
      >
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      <View style={styles.container}>
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
        >
          {t('favorites.title')}
        </Text>

        {verses.length === 0 ? (
          <EmptyState
            icon="heart-outline"
            title={t('favorites.empty')}
            subtitle={t('favorites.emptyHint')}
          />
        ) : (
          <FlatList
            data={verses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.cardRow}>
                <View style={styles.cardWrapper}>
                  <VerseCard verse={item} onPress={handleVersePress} />
                </View>
                <IconButtonAccessible
                  iconName="trash-outline"
                  onPress={() => handleRemove(item.id)}
                  accessibilityLabel={`${t('favorites.remove')}: ${item.bookNameEn} ${item.chapter}:${item.verse}`}
                  accessibilityHint="Remove this verse from favorites"
                  color={colors.error}
                  size={22}
                />
              </View>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardWrapper: {
    flex: 1,
  },
});
