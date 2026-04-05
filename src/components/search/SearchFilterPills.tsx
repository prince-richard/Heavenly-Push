import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

type LanguageFilter = 'all' | 'en' | 'ta';

const THEME_FILTERS = [
  'love',
  'hope',
  'faith',
  'comfort',
  'peace',
  'courage',
  'forgiveness',
  'praise',
  'healing',
  'trust',
] as const;

interface SearchFilterPillsProps {
  selectedLanguage: LanguageFilter;
  selectedThemes: string[];
  onLanguageChange: (lang: LanguageFilter) => void;
  onThemeToggle: (theme: string) => void;
}

export function SearchFilterPills({
  selectedLanguage,
  selectedThemes,
  onLanguageChange,
  onThemeToggle,
}: SearchFilterPillsProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();

  const languageOptions: { key: LanguageFilter; label: string }[] = [
    { key: 'all', label: t('search.filterAll') },
    { key: 'en', label: t('search.filterEnglish') },
    { key: 'ta', label: t('search.filterTamil') },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityRole="tablist"
    >
      {languageOptions.map((option) => {
        const isSelected = selectedLanguage === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onLanguageChange(option.key)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? colors.accent : colors.card,
                borderColor: isSelected ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                {
                  color: isSelected ? colors.background : colors.text,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}

      {THEME_FILTERS.map((theme) => {
        const isSelected = selectedThemes.includes(theme);
        return (
          <Pressable
            key={theme}
            onPress={() => onThemeToggle(theme)}
            accessibilityRole="tab"
            accessibilityLabel={`${theme} theme filter`}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? colors.accent : colors.card,
                borderColor: isSelected ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                {
                  color: isSelected ? colors.background : colors.text,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {theme}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    minHeight: MIN_TOUCH_SIZE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 14,
  },
});
