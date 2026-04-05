import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePlanProgress } from '@/hooks/usePlanProgress';
import { useTTS } from '@/hooks/useTTS';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { RootStackParamList } from '@/types/navigation';

type PlanDetailRoute = RouteProp<RootStackParamList, 'PlanDetail'>;

export function PlanDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const route = useRoute<PlanDetailRoute>();
  const { planId } = route.params;
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const { speakVerse, stop, isSpeaking } = useTTS();

  const { plan, currentDayVerses, progress, markDayComplete, loading } =
    usePlanProgress(planId);

  const handlePlayDay = useCallback(async () => {
    // Play current day's verses sequentially via TTS
    for (const verse of currentDayVerses) {
      await speakVerse(verse, primaryLanguage);
    }
  }, [currentDayVerses, primaryLanguage, speakVerse]);

  const handleStopPlayback = useCallback(() => {
    stop();
  }, [stop]);

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['bottom']}
      >
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={['bottom']}
      >
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Plan not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const title = primaryLanguage === 'ta' ? plan.titleTa : plan.titleEn;
  const description =
    primaryLanguage === 'ta'
      ? plan.descriptionTa ?? plan.descriptionEn
      : plan.descriptionEn;

  const days = Array.from({ length: plan.totalDays }, (_, i) => i + 1);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <View style={styles.container}>
        {/* Plan header */}
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        ) : null}

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressBar, { backgroundColor: colors.inputBackground }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: plan.completed ? colors.success : colors.accent,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
          <Text
            style={[styles.progressText, { color: colors.textSecondary }]}
            accessible={true}
            accessibilityLabel={`Progress: ${progress}%`}
          >
            {plan.completed
              ? t('plans.completed')
              : t('plans.progress', {
                  current: plan.currentDay,
                  total: plan.totalDays,
                })}
          </Text>
        </View>

        {/* Current day action */}
        {!plan.completed && (
          <View style={styles.actionRow}>
            <PrimaryButton
              title={isSpeaking ? 'Stop Playback' : `Play Day ${plan.currentDay}`}
              onPress={isSpeaking ? handleStopPlayback : handlePlayDay}
              accessibilityHint={
                isSpeaking
                  ? 'Stop playing verses'
                  : `Play all verses for day ${plan.currentDay}`
              }
            />
            <PrimaryButton
              title="Mark Complete"
              onPress={markDayComplete}
              accessibilityHint={`Mark day ${plan.currentDay} as complete`}
            />
          </View>
        )}

        {/* Day-by-day list */}
        <FlatList
          data={days}
          keyExtractor={(day) => `day-${day}`}
          renderItem={({ item: day }) => {
            const isCurrent = day === plan.currentDay && !plan.completed;
            const isCompleted = day < plan.currentDay || plan.completed;
            const isFuture = day > plan.currentDay && !plan.completed;

            return (
              <View
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: isCurrent ? colors.card : 'transparent',
                    borderColor: isCurrent ? colors.accent : colors.border,
                  },
                ]}
                accessible={true}
                accessibilityLabel={`Day ${day}${isCompleted ? ', completed' : isCurrent ? ', current day' : ', upcoming'}`}
              >
                <View style={styles.dayHeader}>
                  <Ionicons
                    name={
                      isCompleted
                        ? 'checkmark-circle'
                        : isCurrent
                          ? 'play-circle'
                          : 'ellipse-outline'
                    }
                    size={24}
                    color={
                      isCompleted
                        ? colors.success
                        : isCurrent
                          ? colors.accent
                          : colors.placeholder
                    }
                  />
                  <Text
                    style={[
                      styles.dayLabel,
                      {
                        color: isFuture ? colors.placeholder : colors.text,
                        fontWeight: isCurrent ? '700' : '500',
                      },
                    ]}
                  >
                    Day {day}
                  </Text>
                  <Text style={[styles.verseCount, { color: colors.textSecondary }]}>
                    {plan.dailyVerses[day - 1]?.length ?? 0} verse
                    {(plan.dailyVerses[day - 1]?.length ?? 0) !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  progressContainer: {
    gap: 6,
    marginBottom: 20,
  },
  progressBar: {
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
  },
  actionRow: {
    gap: 12,
    marginBottom: 20,
  },
  list: {
    paddingBottom: 16,
  },
  dayCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: MIN_TOUCH_SIZE,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayLabel: {
    fontSize: 16,
    flex: 1,
  },
  verseCount: {
    fontSize: 13,
  },
});
