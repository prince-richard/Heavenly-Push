import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type AngelState = 'idle' | 'listening' | 'speaking' | 'processing';

interface AngelAvatarProps {
  state: AngelState;
  size?: number;
  glowColor?: string;
  accentColor?: string;
}

/**
 * Animated angel avatar built with pure RN shapes.
 * - idle: gentle floating breath
 * - listening: wings flutter, ears "perk" (halo brightens)
 * - speaking: mouth opens/closes rhythmically, body glows
 * - processing: gentle spin/pulse on the halo
 */
export function AngelAvatar({
  state,
  size = 160,
  glowColor = 'rgba(168, 85, 247, 0.3)',
  accentColor = '#A855F7',
}: AngelAvatarProps) {
  const breathAnim = useRef(new Animated.Value(0)).current;
  const wingAnim = useRef(new Animated.Value(0)).current;
  const mouthAnim = useRef(new Animated.Value(0)).current;
  const haloAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const processAnim = useRef(new Animated.Value(0)).current;

  // Breathing — always active
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathAnim]);

  // Wings flutter when listening
  useEffect(() => {
    if (state === 'listening') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(wingAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(wingAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.timing(wingAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [state, wingAnim]);

  // Mouth animation when speaking
  useEffect(() => {
    if (state === 'speaking') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(mouthAnim, {
            toValue: 1,
            duration: 250,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(mouthAnim, {
            toValue: 0.3,
            duration: 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(mouthAnim, {
            toValue: 0.7,
            duration: 180,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(mouthAnim, {
            toValue: 0,
            duration: 220,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.timing(mouthAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [state, mouthAnim]);

  // Halo rotation for processing
  useEffect(() => {
    if (state === 'processing') {
      const loop = Animated.loop(
        Animated.timing(processAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => loop.stop();
    } else {
      processAnim.setValue(0);
    }
  }, [state, processAnim]);

  // Halo pulse — brightens when listening/speaking
  useEffect(() => {
    const active = state === 'listening' || state === 'speaking';
    if (active) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(haloAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(haloAnim, {
            toValue: 0.4,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.timing(haloAnim, {
        toValue: 0.25,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [state, haloAnim]);

  // Glow intensity
  useEffect(() => {
    const target = state === 'speaking' ? 0.9 : state === 'listening' ? 0.7 : 0.3;
    Animated.timing(glowAnim, {
      toValue: target,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [state, glowAnim]);

  const s = size;
  const headSize = s * 0.38;
  const bodyW = s * 0.32;
  const bodyH = s * 0.28;
  const wingW = s * 0.28;
  const wingH = s * 0.35;
  const haloW = headSize * 1.25;
  const eyeSize = headSize * 0.12;
  const mouthW = headSize * 0.2;

  const bodyY = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  const leftWingRotate = wingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-20deg'],
  });
  const rightWingRotate = wingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '20deg'],
  });

  const mouthScaleY = mouthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const haloSpin = processAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: s, height: s }]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            width: s * 1.3,
            height: s * 1.3,
            borderRadius: s * 0.65,
            backgroundColor: glowColor,
            opacity: glowAnim,
          },
        ]}
      />

      {/* Animated body group */}
      <Animated.View
        style={[
          styles.bodyGroup,
          { transform: [{ translateY: bodyY }] },
        ]}
      >
        {/* Left Wing */}
        <Animated.View
          style={[
            styles.wing,
            styles.wingLeft,
            {
              width: wingW,
              height: wingH,
              borderTopLeftRadius: wingW,
              borderBottomLeftRadius: wingW * 0.3,
              borderTopRightRadius: wingW * 0.1,
              left: s * 0.08,
              top: s * 0.28,
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              borderColor: 'rgba(168, 85, 247, 0.3)',
              transform: [{ rotate: leftWingRotate }],
            },
          ]}
        />

        {/* Right Wing */}
        <Animated.View
          style={[
            styles.wing,
            styles.wingRight,
            {
              width: wingW,
              height: wingH,
              borderTopRightRadius: wingW,
              borderBottomRightRadius: wingW * 0.3,
              borderTopLeftRadius: wingW * 0.1,
              right: s * 0.08,
              top: s * 0.28,
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              borderColor: 'rgba(168, 85, 247, 0.3)',
              transform: [{ rotate: rightWingRotate }],
            },
          ]}
        />

        {/* Halo */}
        <Animated.View
          style={[
            styles.halo,
            {
              width: haloW,
              height: haloW * 0.25,
              borderRadius: haloW / 2,
              borderColor: accentColor,
              top: s * 0.12,
              opacity: haloAnim,
              transform: state === 'processing' ? [{ rotate: haloSpin }] : [],
            },
          ]}
        />

        {/* Head */}
        <View
          style={[
            styles.head,
            {
              width: headSize,
              height: headSize,
              borderRadius: headSize / 2,
              top: s * 0.2,
              backgroundColor: 'rgba(240, 236, 249, 0.9)',
              shadowColor: accentColor,
            },
          ]}
        >
          {/* Eyes */}
          <View style={styles.eyesRow}>
            <View
              style={[
                styles.eye,
                {
                  width: eyeSize,
                  height: state === 'listening' ? eyeSize * 1.3 : eyeSize,
                  borderRadius: eyeSize / 2,
                  backgroundColor: '#1A0F3D',
                },
              ]}
            />
            <View
              style={[
                styles.eye,
                {
                  width: eyeSize,
                  height: state === 'listening' ? eyeSize * 1.3 : eyeSize,
                  borderRadius: eyeSize / 2,
                  backgroundColor: '#1A0F3D',
                },
              ]}
            />
          </View>

          {/* Cheeks (blush) */}
          <View style={styles.cheeksRow}>
            <View
              style={[
                styles.cheek,
                {
                  width: eyeSize * 1.2,
                  height: eyeSize * 0.7,
                  borderRadius: eyeSize,
                  backgroundColor: 'rgba(251, 113, 133, 0.3)',
                },
              ]}
            />
            <View
              style={[
                styles.cheek,
                {
                  width: eyeSize * 1.2,
                  height: eyeSize * 0.7,
                  borderRadius: eyeSize,
                  backgroundColor: 'rgba(251, 113, 133, 0.3)',
                },
              ]}
            />
          </View>

          {/* Mouth */}
          <Animated.View
            style={[
              styles.mouth,
              {
                width: mouthW,
                height: mouthW * 0.5,
                borderBottomLeftRadius: mouthW,
                borderBottomRightRadius: mouthW,
                backgroundColor:
                  state === 'speaking'
                    ? 'rgba(139, 92, 246, 0.5)'
                    : 'rgba(139, 92, 246, 0.2)',
                transform: [{ scaleY: mouthScaleY }],
              },
            ]}
          />
        </View>

        {/* Body / Robe */}
        <View
          style={[
            styles.body,
            {
              width: bodyW,
              height: bodyH,
              borderTopLeftRadius: bodyW * 0.4,
              borderTopRightRadius: bodyW * 0.4,
              borderBottomLeftRadius: bodyW * 0.6,
              borderBottomRightRadius: bodyW * 0.6,
              top: s * 0.2 + headSize * 0.8,
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              borderColor: 'rgba(139, 92, 246, 0.3)',
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
  },
  bodyGroup: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  wing: {
    position: 'absolute',
    borderWidth: 1,
  },
  wingLeft: {
    transformOrigin: 'right center',
  },
  wingRight: {
    transformOrigin: 'left center',
  },
  halo: {
    position: 'absolute',
    borderWidth: 2,
    alignSelf: 'center',
  },
  head: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  eyesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -4,
  },
  eye: {},
  cheeksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 1,
  },
  cheek: {},
  mouth: {
    marginTop: 2,
    alignSelf: 'center',
  },
  body: {
    position: 'absolute',
    alignSelf: 'center',
    borderWidth: 1,
  },
});
