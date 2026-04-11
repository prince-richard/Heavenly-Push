import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useFavoritesStore } from '@/stores/useFavoritesStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

let Haptics: typeof import('expo-haptics') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Haptics = require('expo-haptics');
} catch {
  // expo-haptics not available on web
}

interface FavoriteButtonProps {
  reference: string;
  englishText?: string;
  tamilText?: string;
  size?: number;
}

/**
 * Tappable heart button that toggles a favorite by reference.
 * Persists to AsyncStorage via useFavoritesStore (no local DB).
 */
export function FavoriteButton({
  reference,
  englishText = '',
  tamilText = '',
  size = 28,
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const isFavorite = useFavoritesStore((s) => s.isFavorite(reference));
  const add = useFavoritesStore((s) => s.add);
  const remove = useFavoritesStore((s) => s.remove);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);

  const handlePress = useCallback(() => {
    if (isFavorite) {
      remove(reference);
    } else {
      add({
        reference,
        englishText,
        tamilText,
        snippet: (englishText || tamilText).slice(0, 120),
        language: primaryLanguage,
        savedAt: Date.now(),
      });
    }

    if (hapticsEnabled && Haptics && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [
    isFavorite,
    reference,
    englishText,
    tamilText,
    primaryLanguage,
    add,
    remove,
    hapticsEnabled,
  ]);

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
