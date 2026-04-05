import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SectionHeader } from '@/components/common/SectionHeader';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { BibleVerse, SupportedLanguage } from '@/types/models';
import { useMemorization } from '@/hooks/useMemorization';

interface MemorizationPlayerProps {
  verse: BibleVerse;
  language: SupportedLanguage;
}

export function MemorizationPlayer({
  verse,
  language,
}: MemorizationPlayerProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();

  const {
    chunks,
    currentChunkIndex,
    state,
    currentFeedback,
    progress,
    startChunk,
    submitAttempt,
    selfAssess,
    nextChunk,
    reset,
  } = useMemorization(verse, language);

  const currentChunk = chunks[currentChunkIndex] ?? '';

  const progressPercent = Math.round(progress * 100);
  const isComplete = currentChunkIndex >= chunks.length && state === 'idle';

  return (
    <View style={styles.container}>
      <SectionHeader title={t('verse.memorize')} />

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: colors.inputBackground },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.success,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>
        <Text
          style={[styles.progressText, { color: colors.textSecondary }]}
          accessible={true}
          accessibilityLabel={`Memorization progress: ${progressPercent}%`}
        >
          {progressPercent}%
        </Text>
      </View>

      {isComplete ? (
        <View style={styles.completedContainer}>
          <Text style={[styles.completedText, { color: colors.success }]}>
            Congratulations! Verse memorized!
          </Text>
          <PrimaryButton title="Start Over" onPress={reset} />
        </View>
      ) : (
        <>
          {/* Current chunk display */}
          <View
            style={[styles.chunkContainer, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessible={true}
            accessibilityLabel={`Current chunk: ${currentChunk}`}
          >
            <Text style={[styles.chunkLabel, { color: colors.textSecondary }]}>
              Chunk {currentChunkIndex + 1} of {chunks.length}
            </Text>
            <Text style={[styles.chunkText, { color: colors.text }]}>
              {currentChunk}
            </Text>
          </View>

          {/* Feedback */}
          {currentFeedback && (
            <Text
              style={[
                styles.feedback,
                {
                  color:
                    currentFeedback === 'pass' ? colors.success : colors.error,
                },
              ]}
              accessibilityLiveRegion="polite"
            >
              {currentFeedback === 'pass'
                ? 'Correct! Well done!'
                : 'Not quite. Try again!'}
            </Text>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            {state === 'idle' && (
              <PrimaryButton
                title="Listen"
                onPress={startChunk}
                accessibilityHint="Tap to hear the current chunk"
              />
            )}

            {state === 'listening' && (
              <Text style={[styles.statusText, { color: colors.accent }]}>
                Listening to chunk...
              </Text>
            )}

            {state === 'repeating' && (
              <View style={styles.repeatControls}>
                <PrimaryButton
                  title="My Turn (Speak)"
                  onPress={() => submitAttempt('')}
                  accessibilityHint="Tap to record your attempt"
                />
                <View style={styles.selfAssessRow}>
                  <Text style={[styles.selfAssessLabel, { color: colors.textSecondary }]}>
                    Or self-assess:
                  </Text>
                  <PrimaryButton
                    title="Got it!"
                    onPress={() => selfAssess(true)}
                    style={styles.smallButton}
                  />
                  <PrimaryButton
                    title="Try again"
                    onPress={() => selfAssess(false)}
                    style={{ ...styles.smallButton, backgroundColor: colors.placeholder }}
                  />
                </View>
              </View>
            )}

            {state === 'feedback' && (
              <PrimaryButton
                title={
                  currentFeedback === 'pass' ? 'Next Chunk' : 'Try Again'
                }
                onPress={
                  currentFeedback === 'pass' ? nextChunk : startChunk
                }
              />
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  chunkContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  chunkLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  chunkText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 30,
  },
  feedback: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  controls: {
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    minHeight: MIN_TOUCH_SIZE,
    lineHeight: MIN_TOUCH_SIZE,
  },
  repeatControls: {
    gap: 12,
  },
  selfAssessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  selfAssessLabel: {
    fontSize: 14,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completedContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  completedText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
});
