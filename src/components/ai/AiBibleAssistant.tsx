import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { SectionHeader } from '@/components/common/SectionHeader';
import { QuickAskPills } from '@/components/ai/QuickAskPills';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import {
  explainVerse,
  type ExplainResponse,
} from '@/services/ai/AiBibleService';

interface AiBibleAssistantProps {
  verseReference: string;
  verseText: string;
  verseId: string;
}

export function AiBibleAssistant({
  verseReference,
  verseText,
  verseId,
}: AiBibleAssistantProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);

  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (q?: string) => {
      const queryText = q ?? question;
      if (!queryText.trim()) return;

      setLoading(true);
      setError(null);
      setResult(null);

      AccessibilityInfo.announceForAccessibility(t('ai.loading'));

      try {
        const response = await explainVerse({
          question: queryText.trim(),
          reference: verseReference,
          preferredLanguage: primaryLanguage,
          includeParallelText: true,
        });
        setResult(response);
        AccessibilityInfo.announceForAccessibility(t('ai.explanation'));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('ai.error');
        setError(message);
        AccessibilityInfo.announceForAccessibility(t('ai.error'));
      } finally {
        setLoading(false);
      }
    },
    [question, verseReference, primaryLanguage, t]
  );

  const handleQuickAsk = useCallback(
    (suggestion: string) => {
      setQuestion(suggestion);
      handleSubmit(suggestion);
    },
    [handleSubmit]
  );

  const handleRetry = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  return (
    <View style={styles.container}>
      <SectionHeader title={t('ai.title')} />

      {/* Quick suggestion pills */}
      <QuickAskPills onSelect={handleQuickAsk} disabled={loading} />

      {/* Question input */}
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              backgroundColor: colors.inputBackground,
              borderColor: colors.border,
            },
          ]}
          value={question}
          onChangeText={setQuestion}
          placeholder={t('ai.askPlaceholder')}
          placeholderTextColor={colors.placeholder}
          editable={!loading}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={() => handleSubmit()}
          accessibilityLabel={t('ai.askPlaceholder')}
          accessibilityRole="search"
        />
      </View>

      <PrimaryButton
        title={t('ai.askButton')}
        onPress={() => handleSubmit()}
        disabled={loading || !question.trim()}
        accessibilityHint="Submit your question to the AI assistant"
      />

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingContainer}>
          <LoadingSpinner message={t('ai.loading')} size="small" />
        </View>
      )}

      {/* Error state */}
      {error && !loading && (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
          ]}
        >
          <Text
            style={[styles.errorText, { color: colors.error }]}
            accessibilityRole="alert"
          >
            {error}
          </Text>
          <PrimaryButton
            title={t('ai.retry')}
            onPress={handleRetry}
            accessibilityHint="Retry the AI question"
            style={styles.retryButton}
          />
        </View>
      )}

      {/* Result */}
      {result && !loading && (
        <View
          style={[
            styles.resultContainer,
            { backgroundColor: colors.inputBackground, borderColor: colors.border },
          ]}
          accessible={true}
          accessibilityLabel={`${t('ai.explanation')}: ${result.explanation}`}
        >
          {/* Reference */}
          <Text style={[styles.resultReference, { color: colors.accent }]}>
            {result.reference}
          </Text>

          {/* English verse */}
          {result.englishVerse ? (
            <View style={styles.verseBlock}>
              <Text style={[styles.verseLangLabel, { color: colors.textSecondary }]}>
                English
              </Text>
              <Text style={[styles.verseText, { color: colors.text }]}>
                {result.englishVerse}
              </Text>
            </View>
          ) : null}

          {/* Tamil verse */}
          {result.tamilVerse ? (
            <View style={styles.verseBlock}>
              <Text style={[styles.verseLangLabel, { color: colors.textSecondary }]}>
                Tamil
              </Text>
              <Text style={[styles.verseText, { color: colors.text }]}>
                {result.tamilVerse}
              </Text>
            </View>
          ) : null}

          {/* Explanation */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.accent }]}>
              {t('ai.explanation')}
            </Text>
            <Text style={[styles.explanationText, { color: colors.text }]}>
              {result.explanation}
            </Text>
          </View>

          {/* Summary */}
          {result.shortSummary ? (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.accent }]}>
                {t('ai.summary')}
              </Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {result.shortSummary}
              </Text>
            </View>
          ) : null}

          {/* Provider badge + warnings */}
          <View style={styles.footer}>
            <Text style={[styles.providerBadge, { color: colors.placeholder }]}>
              {t('ai.poweredBy', { provider: result.providerUsed })}
            </Text>
            {result.fallbackUsed && (
              <Text style={[styles.warningText, { color: colors.error }]}>
                {t('ai.fallbackUsed')}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 16,
  },
  inputRow: {
    marginBottom: 12,
  },
  input: {
    minHeight: MIN_TOUCH_SIZE,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  loadingContainer: {
    marginTop: 16,
    minHeight: 80,
  },
  errorContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  resultContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  resultReference: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  verseBlock: {
    marginBottom: 12,
  },
  verseLangLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  providerBadge: {
    fontSize: 11,
    fontWeight: '500',
  },
  warningText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
