import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useFavoritesStore, type FavoriteEntry } from '@/stores/useFavoritesStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { EmptyState } from '@/components/common/EmptyState';
import { IconButtonAccessible } from '@/components/common/IconButtonAccessible';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { RootStackParamList } from '@/types/navigation';

type FavNav = NativeStackNavigationProp<RootStackParamList>;

export function FavoritesScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const navigation = useNavigation<FavNav>();
  const favorites = useFavoritesStore((s) => s.favorites);
  const removeFavorite = useFavoritesStore((s) => s.remove);
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);

  const handlePress = useCallback(
    (entry: FavoriteEntry) => {
      navigation.navigate('VerseDetail', { reference: entry.reference });
    },
    [navigation],
  );

  const handleRemove = useCallback(
    (reference: string) => {
      removeFavorite(reference);
      AccessibilityInfo.announceForAccessibility(t('favorites.remove'));
    },
    [removeFavorite, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: FavoriteEntry }) => {
      const text =
        primaryLanguage === 'ta'
          ? item.tamilText || item.englishText
          : item.englishText || item.tamilText;
      return (
        <View style={styles.row}>
          <Pressable
            onPress={() => handlePress(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.reference}. ${text}`}
            accessibilityHint="Double tap to open this verse"
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
              {item.reference}
            </Text>
            {text ? (
              <Text style={[styles.text, { color: colors.text }]} numberOfLines={4}>
                {text}
              </Text>
            ) : null}
          </Pressable>
          <IconButtonAccessible
            iconName="trash-outline"
            onPress={() => handleRemove(item.reference)}
            accessibilityLabel={`${t('favorites.remove')}: ${item.reference}`}
            accessibilityHint="Remove this verse from favorites"
            color={colors.error}
            size={22}
          />
        </View>
      );
    },
    [colors, primaryLanguage, handlePress, handleRemove, t],
  );

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

        {favorites.length === 0 ? (
          <EmptyState
            icon="heart-outline"
            title={t('favorites.empty')}
            subtitle={t('favorites.emptyHint')}
          />
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.reference}
            renderItem={renderItem}
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: MIN_TOUCH_SIZE,
  },
  reference: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});
