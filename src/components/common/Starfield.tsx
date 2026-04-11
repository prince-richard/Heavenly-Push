import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Dimensions } from 'react-native';

interface StarfieldProps {
  /** Number of stars to render. Keep small — they all animate. */
  count?: number;
  /** Star color — usually the theme's gold or accentLight. */
  color?: string;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/**
 * Softly twinkling stars in the background. A few handful of tiny
 * dots fading in and out on a loop. Absolutely positioned, pointer
 * events disabled so it never interferes with taps.
 */
export function Starfield({ count = 18, color = '#FCD34D' }: StarfieldProps) {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_W,
      y: Math.random() * (SCREEN_H * 0.75),
      size: 2 + Math.random() * 3,
      delay: Math.random() * 2500,
      duration: 1800 + Math.random() * 2200,
    }));
  }, [count]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star) => (
        <Star key={star.id} star={star} color={color} />
      ))}
    </View>
  );
}

function Star({ star, color }: { star: Star; color: string }) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(star.delay),
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: star.duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.15,
          duration: star.duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, star.delay, star.duration]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: star.x,
        top: star.y,
        width: star.size,
        height: star.size,
        borderRadius: star.size / 2,
        backgroundColor: color,
        opacity,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: star.size * 1.5,
      }}
    />
  );
}
