import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import { DEBOUNCE_MS } from '@/constants/config';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  onVoicePress?: () => void;
  showVoiceButton?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onVoicePress,
  showVoiceButton = true,
}: SearchBarProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const [localValue, setLocalValue] = useState(value);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes (e.g., from voice transcript)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChangeText = useCallback(
    (text: string) => {
      setLocalValue(text);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        onChangeText(text);
      }, DEBOUNCE_MS);
    },
    [onChangeText]
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChangeText('');
  }, [onChangeText]);

  const handleSubmitEditing = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    onChangeText(localValue);
    onSubmit?.(localValue);
  }, [localValue, onChangeText, onSubmit]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.inputBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <Ionicons
        name="search-outline"
        size={22}
        color={colors.placeholder}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={localValue}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmitEditing}
        placeholder={t('search.placeholder')}
        placeholderTextColor={colors.placeholder}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={t('accessibility.searchInput')}
        accessibilityRole="search"
        accessibilityHint="Type to search for Bible verses"
      />
      {localValue.length > 0 && (
        <Pressable
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.iconButton}
        >
          <Ionicons name="close-circle" size={22} color={colors.placeholder} />
        </Pressable>
      )}
      {showVoiceButton && onVoicePress && (
        <Pressable
          onPress={onVoicePress}
          accessibilityRole="button"
          accessibilityLabel={t('search.voiceButton')}
          accessibilityHint="Double tap to search by voice"
          style={styles.iconButton}
        >
          <Ionicons name="mic-outline" size={24} color={colors.accent} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: MIN_TOUCH_SIZE + 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 10,
    minHeight: MIN_TOUCH_SIZE,
  },
  iconButton: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
