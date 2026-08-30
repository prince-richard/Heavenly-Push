import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
type PlanDetailNav = NativeStackNavigationProp<RootStackParamList>;

export function PlanDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const route = useRoute<PlanDetailRoute>();
  const navigation = useNavigation<PlanDetailNav>();
  const { planId } = route.params;
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const { speakVerse, stop, isSpeaking } = useTTS();

  const { plan, currentDayVerses, progress, markDayComplete, loading } =
    usePlanProgress(planId);

  const handlePlayDay = useCallback(async () => {
    for (const verse of currentDayVerses) {
      await speakVerse(verse, primaryLanguage);
    }
  }, [currentDayVerses, primaryLanguage, speakVerse]);

  const handleStopPlayback = useCallback(() => {
    stop();
  }, [stop]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={colors.backdropGradient as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LoadingSpinner />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LinearGradient
          colors={colors.backdropGradient as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Plan not found
          </Text>
        </View>
      </View>
    );
  }

  const title = primaryLanguage === 'ta' ? plan.titleTa : plan.titleEn;
  const description =
    primaryLanguage === 'ta'
      ? plan.descriptionTa ?? plan.descriptionEn
      : plan.descriptionEn;

  const days = Array.from({ length: plan.totalDays }, (_, i) => i + 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={colors.backdropGradient as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
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
        <View style={[styles.progressCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
          <View
            style={[styles.progressBar, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}
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

            const verseIds = plan.dailyVerses[day - 1] ?? [];

            return (
              <Pressable
                onPress={() => {
                  if (verseIds.length > 0) {
                    navigation.navigate('VerseDetail', { verseId: verseIds[0] });
                  }
                }}
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: isCurrent ? colors.glass : 'transparent',
                    borderColor: isCurrent ? colors.accent : colors.glassBorder,
                  },
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Day ${day}${isCompleted ? ', completed' : isCurrent ? ', current day' : ', upcoming'}. ${verseIds.length} verse${verseIds.length !== 1 ? 's' : ''}`}
                accessibilityHint="Tap to view verse"
              >
                <View style={styles.dayHeader}>
                  <View style={[styles.dayIconCircle, {
                    backgroundColor: isCompleted
                      ? 'rgba(52, 211, 153, 0.15)'
                      : isCurrent
                        ? 'rgba(139, 92, 246, 0.15)'
                        : 'transparent',
                  }]}>
                    <Ionicons
                      name={
                        isCompleted
                          ? 'checkmark-circle'
                          : isCurrent
                            ? 'play-circle'
                            : 'ellipse-outline'
                      }
                      size={22}
                      color={
                        isCompleted
                          ? colors.success
                          : isCurrent
                            ? colors.accent
                            : colors.placeholder
                      }
                    />
                  </View>
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
                    {verseIds.length} verse
                    {verseIds.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.verseIdList}>
                  {verseIds.map((id: string) => (
                    <Text
                      key={id}
                      style={[styles.verseId, { color: colors.link }]}
                    >
                      {id.replace(/-/g, ' ').replace(/(\d+)$/, ':$1')}
                    </Text>
                  ))}
                </View>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
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
    gap: 12,
  },
  errorText: {
    fontSize: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  progressCard: {
    gap: 8,
    marginBottom: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
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
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: MIN_TOUCH_SIZE,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 16,
    flex: 1,
  },
  verseCount: {
    fontSize: 13,
  },
  verseIdList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingLeft: 46,
  },
  verseId: {
    fontSize: 13,
  },
});
