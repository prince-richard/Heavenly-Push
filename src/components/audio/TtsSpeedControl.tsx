import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { IconButtonAccessible } from '@/components/common/IconButtonAccessible';
import { MIN_TTS_SPEED, MAX_TTS_SPEED, TTS_SPEED_STEP } from '@/constants/config';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

export function TtsSpeedControl() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const ttsSpeed = useSettingsStore((s) => s.ttsSpeed);
  const setTtsSpeed = useSettingsStore((s) => s.setTtsSpeed);

  const handleDecrease = () => {
    const newSpeed = Math.max(MIN_TTS_SPEED, ttsSpeed - TTS_SPEED_STEP);
    setTtsSpeed(Math.round(newSpeed * 100) / 100);
  };

  const handleIncrease = () => {
    const newSpeed = Math.min(MAX_TTS_SPEED, ttsSpeed + TTS_SPEED_STEP);
    setTtsSpeed(Math.round(newSpeed * 100) / 100);
  };

  const speedLabel =
    ttsSpeed <= 0.75
      ? t('settings.ttsSpeedSlow')
      : ttsSpeed >= 1.5
        ? t('settings.ttsSpeedFast')
        : t('settings.ttsSpeedNormal');

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel={`${t('settings.ttsSpeed')}: ${ttsSpeed}x ${speedLabel}`}
      accessibilityActions={[
        { name: 'increment', label: 'Increase speed' },
        { name: 'decrement', label: 'Decrease speed' },
      ]}
      onAccessibilityAction={(event) => {
        switch (event.nativeEvent.actionName) {
          case 'increment':
            handleIncrease();
            break;
          case 'decrement':
            handleDecrease();
            break;
        }
      }}
    >
      <IconButtonAccessible
        iconName="remove-circle-outline"
        onPress={handleDecrease}
        accessibilityLabel="Decrease reading speed"
        disabled={ttsSpeed <= MIN_TTS_SPEED}
      />
      <View style={styles.labelContainer}>
        <Text style={[styles.speed, { color: colors.text }]}>
          {ttsSpeed.toFixed(2)}x
        </Text>
        <Text style={[styles.speedLabel, { color: colors.textSecondary }]}>
          {speedLabel}
        </Text>
      </View>
      <IconButtonAccessible
        iconName="add-circle-outline"
        onPress={handleIncrease}
        accessibilityLabel="Increase reading speed"
        disabled={ttsSpeed >= MAX_TTS_SPEED}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: MIN_TOUCH_SIZE,
  },
  labelContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  speed: {
    fontSize: 18,
    fontWeight: '700',
  },
  speedLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
