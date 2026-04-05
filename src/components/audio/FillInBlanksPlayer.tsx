import React, { useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SectionHeader } from '@/components/common/SectionHeader';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { BibleVerse, SupportedLanguage } from '@/types/models';
import { useFillInBlanks } from '@/hooks/useFillInBlanks';

interface FillInBlanksPlayerProps {
  verse: BibleVerse;
  language: SupportedLanguage;
}

export function FillInBlanksPlayer({
  verse,
  language,
}: FillInBlanksPlayerProps) {
  const { colors } = useAccessibility();

  const { segments, score, submitAnswer, isComplete, reset } =
    useFillInBlanks(verse, language);

  const handleAnswerChange = useCallback(
    (index: number, text: string) => {
      submitAnswer(index, text);
    },
    [submitAnswer]
  );

  return (
    <View style={styles.container}>
      <SectionHeader title="Fill in the Blanks" />

      {/* Score display */}
      {isComplete && (
        <View style={styles.scoreContainer}>
          <Text
            style={[
              styles.scoreText,
              { color: score >= 70 ? colors.success : colors.error },
            ]}
            accessibilityLabel={`Score: ${score} percent`}
          >
            Score: {score}%
          </Text>
        </View>
      )}

      {/* Verse with blanks */}
      <View style={styles.verseContainer}>
        {segments.map((segment, index) => {
          if (!segment.isBlank) {
            return (
              <Text
                key={index}
                style={[styles.wordText, { color: colors.text }]}
              >
                {segment.text}{' '}
              </Text>
            );
          }

          const isCorrect =
            segment.answer.toLowerCase().trim() ===
            segment.originalWord.toLowerCase();
          const hasAnswer = segment.answer.trim().length > 0;

          return (
            <View key={index} style={styles.blankWrapper}>
              <TextInput
                style={[
                  styles.blankInput,
                  {
                    borderColor: hasAnswer
                      ? isCorrect
                        ? colors.success
                        : colors.error
                      : colors.border,
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
                value={segment.answer}
                onChangeText={(text) => handleAnswerChange(index, text)}
                placeholder="___"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={`Blank ${index + 1}. Enter the missing word.`}
                accessibilityHint="Type the missing word from the verse"
              />
              {hasAnswer && isComplete && !isCorrect && (
                <Text
                  style={[styles.correctAnswer, { color: colors.success }]}
                >
                  {segment.originalWord}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      <PrimaryButton
        title="Reset"
        onPress={reset}
        accessibilityHint="Reset fill in the blanks exercise"
        style={styles.resetButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '700',
  },
  verseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  wordText: {
    fontSize: 18,
    lineHeight: 32,
  },
  blankWrapper: {
    alignItems: 'center',
  },
  blankInput: {
    borderBottomWidth: 2,
    fontSize: 18,
    minWidth: 80,
    minHeight: MIN_TOUCH_SIZE,
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  correctAnswer: {
    fontSize: 12,
    marginTop: 2,
  },
  resetButton: {
    alignSelf: 'center',
  },
});
