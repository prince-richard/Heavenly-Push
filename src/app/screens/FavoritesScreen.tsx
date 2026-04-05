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
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { RootStackParamList } from '@/types/navigation';
import type { BibleVerse } from '@/types/models';
import { getDatabase } from '@/db/database';
import { VerseRepository } from '@/db/repositories/VerseRepository';
import { FavoritesRepository } from '@/db/repositories/FavoritesRepository';

type FavNav = NativeStackNavigationProp<RootStackParamList>;

export function FavoritesScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const navigation = useNavigation<FavNav>();
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const removeFavorite = useFavoritesStore((s) => s.remove);

  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorite verses
  useEffect(() => {
    setLoading(true);
    try {
      const db = getDatabase();
      const verseRepo = new VerseRepository(db);
      const ids = Array.from(favoriteIds);
      const loaded = ids
        .map((id) => verseRepo.getById(id))
        .filter((v): v is BibleVerse => v !== null);
      setVerses(loaded);
    } catch {
      setVerses([]);
    } finally {
      setLoading(false);
    }
  }, [favoriteIds]);

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
      try {
        const db = getDatabase();
        const favRepo = new FavoritesRepository(db);
        favRepo.remove(verseId);
      } catch {
        // DB sync error — store already updated optimistically
      }

      AccessibilityInfo.announceForAccessibility(
        t('favorites.remove')
      );
    },
    [removeFavorite, t]
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
