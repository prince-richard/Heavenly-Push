import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { isWeb } from '@/utils/platform';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SHAKE_COOLDOWN_MS, SHAKE_THRESHOLD } from '@/constants/config';

/**
 * Hook that detects device shaking and triggers a callback.
 * Uses expo-sensors Accelerometer at 100ms interval.
 * No-op on web. Gated on shakeToSpeakEnabled setting.
 */
export function useShakeDetector(onShake: () => void): void {
  const lastShakeRef = useRef<number>(0);
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  const shakeEnabled = useSettingsStore((s) => s.shakeToSpeakEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  useEffect(() => {
    // No-op on web — accelerometer not meaningful
    if (isWeb()) return;

    // No-op if shake detection is disabled
    if (!shakeEnabled) return;

    // Magnitude threshold: ~1.5g where g ≈ 9.81 m/s²
    const threshold = SHAKE_THRESHOLD * 9.81;

    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener((data) => {
      const { x, y, z } = data;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      // expo-sensors returns acceleration in g units (1g ≈ 9.81)
      // but the raw values from Accelerometer are already in g units
      // so we compare against SHAKE_THRESHOLD directly
      const magnitudeInG = magnitude;

      if (magnitudeInG > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - lastShakeRef.current > SHAKE_COOLDOWN_MS) {
          lastShakeRef.current = now;

          // Haptic feedback if enabled
          if (hapticsEnabled) {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
          }

          onShakeRef.current();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [shakeEnabled, hapticsEnabled]);
}
