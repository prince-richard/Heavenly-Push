import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';

interface HaloProps {
  /** Outer diameter of the halo, in pixels. */
  size: number;
  /** When true the halo expands and pulses. */
  active?: boolean;
  /** Color of the halo (use theme.accent or theme.gold). */
  color: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * A soft glowing halo that wraps a child element. When `active`, the
 * halo radiates outward in two staggered rings — used to make the mic
 * button feel alive while listening.
 *
 * No external animation libraries — pure React Native Animated.
 */
export function Halo({ size, active = false, color, children, style }: HaloProps) {
  const ringA = useRef(new Animated.Value(0)).current;
  const ringB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      ringA.stopAnimation();
      ringB.stopAnimation();
      ringA.setValue(0);
      ringB.setValue(0);
      return;
    }

    const loopA = Animated.loop(
      Animated.timing(ringA, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    const loopB = Animated.loop(
      Animated.timing(ringB, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
        delay: 1100,
      }),
    );
    loopA.start();
    loopB.start();

    return () => {
      loopA.stop();
      loopB.stop();
    };
  }, [active, ringA, ringB]);

  const ringSize = size * 1.45;

  const ringStyle = (anim: Animated.Value): ViewStyle => ({
    position: 'absolute',
    width: ringSize,
    height: ringSize,
    borderRadius: ringSize / 2,
    borderWidth: 3,
    borderColor: color,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.25] }),
      },
    ],
  });

  return (
    <View
      style={[
        styles.container,
        { width: ringSize, height: ringSize },
        style,
      ]}
      pointerEvents="box-none"
    >
      {active ? (
        <>
          <Animated.View style={ringStyle(ringA)} />
          <Animated.View style={ringStyle(ringB)} />
        </>
      ) : null}
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
