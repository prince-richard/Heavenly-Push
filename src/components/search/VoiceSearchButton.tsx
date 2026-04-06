import React, { useEffect, useRef } from 'react';
import { Pressable, View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useVoiceStore } from '@/stores/useVoiceStore';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

interface VoiceSearchButtonProps {
  onPress: () => void;
  size?: number;
}

export function VoiceSearchButton({
  onPress,
  size = 64,
}: VoiceSearchButtonProps) {
  const { t } = useTranslation();
  const { colors, isReducedMotion } = useAccessibility();
  const isListening = useVoiceStore((s) => s.isListening);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening && !isReducedMotion) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, isReducedMotion, pulseAnim]);

  const buttonSize = Math.max(size, MIN_TOUCH_SIZE);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      {/* Outer glow ring when listening */}
      {isListening && (
        <View
          style={[
            styles.glowRing,
            {
              width: buttonSize + 12,
              height: buttonSize + 12,
              borderRadius: (buttonSize + 12) / 2,
              borderColor: colors.accent + '40',
              position: 'absolute',
              top: -6,
              left: -6,
            },
          ]}
        />
      )}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={
          isListening
            ? t('home.voiceSearch') + ' - Listening...'
            : t('accessibility.voiceSearchButton')
        }
        accessibilityHint={
          isListening
            ? 'Double tap to stop listening'
            : 'Double tap to start voice search'
        }
        accessibilityState={{ busy: isListening }}
        style={({ pressed }) => [
          styles.button,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: isListening
              ? colors.accentDark
              : colors.accent,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons
          name={isListening ? 'mic' : 'mic-outline'}
          size={buttonSize * 0.45}
          color="#FFFFFF"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  glowRing: {
    borderWidth: 3,
  },
});
