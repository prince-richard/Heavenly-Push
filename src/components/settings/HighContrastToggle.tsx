import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAccessibility } from '@/hooks/useAccessibility';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

export function HighContrastToggle() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const highContrastMode = useSettingsStore((s) => s.highContrastMode);
  const toggleHighContrast = useSettingsStore((s) => s.toggleHighContrast);

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.text }]}>
        {t('settings.highContrast')}
      </Text>
      <Switch
        value={highContrastMode}
        onValueChange={toggleHighContrast}
        trackColor={{ false: colors.placeholder, true: colors.accent }}
        thumbColor={colors.background}
        accessibilityLabel={t('settings.highContrast')}
        accessibilityRole="switch"
        accessibilityState={{ checked: highContrastMode }}
        style={{ minWidth: MIN_TOUCH_SIZE, minHeight: MIN_TOUCH_SIZE }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_SIZE,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
});
