import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Animated, Easing } from 'react-native';
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
            toValue: 1.2,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
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
            backgroundColor: isListening ? colors.error : colors.accent,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Ionicons
          name={isListening ? 'mic' : 'mic-outline'}
          size={buttonSize * 0.5}
          color={colors.background}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
