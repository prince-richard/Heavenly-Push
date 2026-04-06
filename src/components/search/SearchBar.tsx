import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useVoiceStore } from '@/stores/useVoiceStore';
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
  const isListening = useVoiceStore((s) => s.isListening);
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
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
    [onChangeText],
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
          borderColor: isFocused ? colors.accent : 'transparent',
        },
      ]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={isFocused ? colors.accent : colors.placeholder}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={localValue}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmitEditing}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
          <View
            style={[
              styles.clearIconBg,
              { backgroundColor: colors.placeholder + '30' },
            ]}
          >
            <Ionicons name="close" size={14} color={colors.textSecondary} />
          </View>
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
          <View
            style={[
              styles.micIconBg,
              {
                backgroundColor: isListening
                  ? colors.accent
                  : colors.accent + '18',
              },
            ]}
          >
            <Ionicons
              name={isListening ? 'mic' : 'mic-outline'}
              size={18}
              color={isListening ? colors.background : colors.accent}
            />
          </View>
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
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: MIN_TOUCH_SIZE + 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 12,
    minHeight: MIN_TOUCH_SIZE,
  },
  iconButton: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
