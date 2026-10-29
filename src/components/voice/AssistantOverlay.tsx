import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVoiceStore } from '@/stores/useVoiceStore';
import { useAccessibility } from '@/hooks/useAccessibility';
import { AngelAvatar } from '@/components/common/AngelAvatar';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';

interface Props {
  onClose: () => void;
  onAskAgain: () => void;
  onStopSpeaking: () => void;
}

/**
 * Full-screen, opaque assistant view. Covers (and blocks input to) the whole
 * app while the user is talking to the assistant, so the only thing on screen
 * is what they asked and the answer.
 */
export function AssistantOverlay({ onClose, onAskAgain, onStopSpeaking }: Props) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const insets = useSafeAreaInsets();

  const phase = useVoiceStore((s) => s.assistantPhase);
  const angelState = useVoiceStore((s) => s.angelState);
  const partial = useVoiceStore((s) => s.partialTranscript);
  const question = useVoiceStore((s) => s.assistantQuestion);
  const translation = useVoiceStore((s) => s.assistantQuestionTranslation);
  const answer = useVoiceStore((s) => s.assistantAnswer);
  const verses = useVoiceStore((s) => s.assistantVerses);
  const error = useVoiceStore((s) => s.assistantError);
  const language = useVoiceStore((s) => s.recognitionLanguage);

  if (phase === 'closed') return null;

  const isTa = language === 'ta';
  const isSpeaking = angelState === 'speaking';

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 12,
        },
      ]}
      accessibilityViewIsModal
      importantForAccessibility="yes"
      testID="assistant-overlay"
    >
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
        >
          {t('assistant.title')}
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('assistant.close')}
          hitSlop={8}
          style={[styles.iconButton, { borderColor: colors.glassBorder }]}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.angel}>
          <AngelAvatar
            state={angelState}
            size={120}
            glowColor={colors.angelGlow}
            accentColor={colors.accent}
          />
        </View>

        {phase === 'listening' && !question ? (
          <View accessibilityLiveRegion="polite">
            <Text style={[styles.status, { color: colors.accent }]}>
              {t('assistant.listening')}
            </Text>
            {partial ? (
              <Text style={[styles.question, { color: colors.text }]}>{partial}</Text>
            ) : null}
          </View>
        ) : null}

        {question ? (
          <View
            style={[styles.card, { backgroundColor: colors.chatUser, borderColor: colors.glassBorder }]}
            accessible
            accessibilityLabel={`${t('assistant.youAsked')}: ${question}`}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('assistant.youAsked')}
            </Text>
            <Text style={[styles.question, { color: colors.text }]}>{question}</Text>
            {translation ? (
              <Text style={[styles.translation, { color: colors.textSecondary }]}>
                {translation}
              </Text>
            ) : null}
          </View>
        ) : null}

        {phase === 'listening' && question ? (
          <Text style={[styles.status, { color: colors.accent }]} accessibilityLiveRegion="polite">
            {partial || t('assistant.listening')}
          </Text>
        ) : null}

        {phase === 'thinking' ? (
          <View style={styles.thinking} accessibilityLiveRegion="polite">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.status, { color: colors.accent }]}>
              {t('assistant.thinking')}
            </Text>
          </View>
        ) : null}

        {answer ? (
          <View
            style={[styles.card, { backgroundColor: colors.chatAssistant, borderColor: colors.glassBorder }]}
            accessibilityLiveRegion="polite"
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('assistant.answer')}
            </Text>
            <Text style={[styles.answer, { color: colors.text }]}>{answer}</Text>
          </View>
        ) : null}

        {verses.length > 0 ? (
          <View style={styles.verses}>
            <Text style={[styles.label, { color: colors.textSecondary }]} accessibilityRole="header">
              {t('assistant.verses')}
            </Text>
            {verses.map((v) => {
              const text = (isTa ? v.tamilText : v.englishText) || v.englishText || v.tamilText;
              return (
                <View
                  key={v.reference}
                  style={[styles.verse, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
                  accessible
                  accessibilityLabel={`${v.reference}. ${text}`}
                >
                  <Text style={[styles.reference, { color: colors.accent }]}>{v.reference}</Text>
                  {text ? <Text style={[styles.verseText, { color: colors.text }]}>{text}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {phase === 'error' ? (
          <Text style={[styles.status, { color: colors.error }]} accessibilityLiveRegion="assertive">
            {error || t('assistant.error')}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {isSpeaking ? (
          <Pressable
            onPress={onStopSpeaking}
            accessibilityRole="button"
            accessibilityLabel={t('assistant.stopSpeaking')}
            style={[styles.button, { borderColor: colors.accent }]}
          >
            <Ionicons name="stop" size={22} color={colors.accent} />
            <Text style={[styles.buttonText, { color: colors.accent }]}>
              {t('assistant.stopSpeaking')}
            </Text>
          </Pressable>
        ) : null}
        {phase === 'answered' || phase === 'error' ? (
          <Pressable
            onPress={onAskAgain}
            accessibilityRole="button"
            accessibilityLabel={phase === 'error' ? t('assistant.tryAgain') : t('assistant.askAgain')}
            style={[styles.button, styles.primary, { backgroundColor: colors.accent, borderColor: colors.accent }]}
          >
            <Ionicons name="mic" size={22} color="#FFFFFF" />
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
              {phase === 'error' ? t('assistant.tryAgain') : t('assistant.askAgain')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 2000,
    elevation: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  iconButton: {
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MIN_TOUCH_SIZE / 2,
    borderWidth: 1,
  },
  body: {
    paddingVertical: 16,
    gap: 16,
  },
  angel: {
    alignItems: 'center',
  },
  status: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  thinking: {
    alignItems: 'center',
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  question: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    textAlign: 'center',
  },
  translation: {
    fontSize: 18,
    lineHeight: 26,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  answer: {
    fontSize: 20,
    lineHeight: 30,
  },
  verses: {
    gap: 10,
  },
  verse: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  reference: {
    fontSize: 17,
    fontWeight: '700',
  },
  verseText: {
    fontSize: 18,
    lineHeight: 27,
  },
  footer: {
    gap: 10,
  },
  button: {
    minHeight: 56,
    borderRadius: 28,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: {},
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
