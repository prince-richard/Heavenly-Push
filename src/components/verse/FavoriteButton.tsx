import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useDatabase } from '@/contexts/DatabaseContext';
import { FavoritesRepository } from '@/db/repositories/FavoritesRepository';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

let Haptics: typeof import('expo-haptics') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Haptics = require('expo-haptics');
} catch {
  // expo-haptics not available on web
}

interface FavoriteButtonProps {
  verseId: string;
  size?: number;
}

export function FavoriteButton({ verseId, size = 28 }: FavoriteButtonProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const db = useDatabase();
  const isFavorite = useFavoritesStore((s) => s.isFavorite(verseId));
  const add = useFavoritesStore((s) => s.add);
  const remove = useFavoritesStore((s) => s.remove);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  const handlePress = useCallback(() => {
    if (isFavorite) {
      remove(verseId);
      // Persist removal to DB
      const favRepo = new FavoritesRepository(db);
      void favRepo.remove(verseId).catch((err) =>
        console.error('FavoriteButton remove error:', err)
      );
    } else {
      add(verseId);
      // Persist addition to DB
      const favRepo = new FavoritesRepository(db);
      void favRepo.add(verseId).catch((err) =>
        console.error('FavoriteButton add error:', err)
      );
    }

    if (hapticsEnabled && Haptics && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [db, isFavorite, verseId, add, remove, hapticsEnabled]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite ? t('verse.removeFavorite') : t('verse.addFavorite')
      }
      accessibilityHint={
        isFavorite
          ? 'Double tap to remove from favorites'
          : 'Double tap to add to favorites'
      }
      accessibilityState={{ selected: isFavorite }}
      style={({ pressed }) => [
        styles.button,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={isFavorite ? colors.error : colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
