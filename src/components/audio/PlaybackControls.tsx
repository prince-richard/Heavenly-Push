import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { usePlaybackStore } from '@/stores/usePlaybackStore';
import { IconButtonAccessible } from '@/components/common/IconButtonAccessible';
import { TtsSpeedControl } from './TtsSpeedControl';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

interface PlaybackControlsProps {
  onPlay: () => void;
  onPause?: () => void;
  onStop: () => void;
  onRepeat?: () => void;
}

export function PlaybackControls({
  onPlay,
  onPause,
  onStop,
  onRepeat,
}: PlaybackControlsProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const speakingStatus = usePlaybackStore((s) => s.speakingStatus);

  const isSpeaking = speakingStatus === 'speaking';
  const isPaused = speakingStatus === 'paused';

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        {isSpeaking || isPaused ? (
          <>
            {onPause && (
              <IconButtonAccessible
                iconName={isPaused ? 'play' : 'pause'}
                onPress={isPaused ? onPlay : onPause}
                accessibilityLabel={
                  isPaused
                    ? t('accessibility.playButton')
                    : t('accessibility.pauseButton')
                }
                size={36}
                color={colors.accent}
              />
            )}
            <IconButtonAccessible
              iconName="stop"
              onPress={onStop}
              accessibilityLabel={t('accessibility.stopButton')}
              size={36}
              color={colors.error}
            />
          </>
        ) : (
          <IconButtonAccessible
            iconName="play"
            onPress={onPlay}
            accessibilityLabel={t('accessibility.playButton')}
            accessibilityHint="Double tap to read verse aloud"
            size={36}
            color={colors.accent}
          />
        )}

        {onRepeat && (
          <IconButtonAccessible
            iconName="repeat"
            onPress={onRepeat}
            accessibilityLabel="Repeat"
            accessibilityHint="Double tap to repeat verse"
            size={28}
            color={colors.text}
          />
        )}
      </View>

      <TtsSpeedControl />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    gap: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    minHeight: MIN_TOUCH_SIZE,
  },
});
