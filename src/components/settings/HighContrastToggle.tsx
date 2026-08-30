import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAccessibility } from '@/hooks/useAccessibility';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

export function HighContrastToggle() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const highContrastMode = useSettingsStore((s) => s.highContrastMode);
  const toggleHighContrast = useSettingsStore((s) => s.toggleHighContrast);

  return (
    <View style={[styles.row, { borderBottomColor: colors.glassBorder }]}>
      <View style={styles.labelRow}>
        <Ionicons
          name={highContrastMode ? 'moon' : 'sunny'}
          size={20}
          color={colors.accent}
        />
        <Text style={[styles.label, { color: colors.text }]}>
          {t('settings.highContrast', { defaultValue: 'Dark Mode' })}
        </Text>
      </View>
      <Switch
        value={highContrastMode}
        onValueChange={toggleHighContrast}
        trackColor={{ false: 'rgba(163,163,163,0.3)', true: colors.accent }}
        thumbColor={highContrastMode ? '#FFFFFF' : 'rgba(255,255,255,0.9)'}
        accessibilityLabel={t('settings.highContrast', { defaultValue: 'Dark Mode' })}
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
  },
});
