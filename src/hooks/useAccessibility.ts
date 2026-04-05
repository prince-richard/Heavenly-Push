import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, PixelRatio } from 'react-native';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { darkHighContrast, lightHighContrast } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';

interface AccessibilityState {
  fontScale: number;
  isReducedMotion: boolean;
  isScreenReaderEnabled: boolean;
  colors: ThemeColors;
}

export function useAccessibility(): AccessibilityState {
  const highContrastMode = useSettingsStore((s) => s.highContrastMode);
  const [fontScale, setFontScale] = useState(PixelRatio.getFontScale());
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotion);
    AccessibilityInfo.isScreenReaderEnabled().then(setIsScreenReaderEnabled);

    const reduceMotionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReducedMotion
    );
    const screenReaderSub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled
    );

    return () => {
      reduceMotionSub.remove();
      screenReaderSub.remove();
    };
  }, []);

  const colors = highContrastMode ? darkHighContrast : lightHighContrast;

  return {
    fontScale,
    isReducedMotion,
    isScreenReaderEnabled,
    colors,
  };
}
