import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { EmptyState } from '@/components/common/EmptyState';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { RootStackParamList } from '@/types/navigation';
import type { AudioPlan } from '@/types/models';
import defaultPlans from '@/data/plans/default-plans.json';

type PlansNav = NativeStackNavigationProp<RootStackParamList>;

export function PlansScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const navigation = useNavigation<PlansNav>();
  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);

  const [plans] = useState<AudioPlan[]>(defaultPlans as AudioPlan[]);

  const handlePlanPress = useCallback(
    (plan: AudioPlan) => {
      navigation.navigate('PlanDetail', { planId: plan.planId });
    },
    [navigation]
  );

  const getPlanTitle = (plan: AudioPlan): string => {
    return primaryLanguage === 'ta' ? plan.titleTa : plan.titleEn;
  };

  const getPlanDescription = (plan: AudioPlan): string => {
    return primaryLanguage === 'ta'
      ? plan.descriptionTa ?? plan.descriptionEn ?? ''
      : plan.descriptionEn ?? '';
  };

  const getProgress = (plan: AudioPlan): number => {
    if (plan.completed) return 100;
    return Math.round(((plan.currentDay - 1) / plan.totalDays) * 100);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={colors.backdropGradient as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.container}>
          <Text
            style={[styles.title, { color: colors.text }]}
            accessibilityRole="header"
          >
            {t('plans.title')}
          </Text>

          {plans.length === 0 ? (
            <EmptyState
              icon="book-outline"
              title={t('plans.empty')}
              subtitle={t('plans.emptyHint')}
            />
          ) : (
            <FlatList
              data={plans}
              keyExtractor={(item) => item.planId}
              renderItem={({ item }) => {
                const progress = getProgress(item);
                return (
                  <Pressable
                    onPress={() => handlePlanPress(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${getPlanTitle(item)}. ${t('plans.progress', { current: item.currentDay, total: item.totalDays })}. ${progress}% complete.`}
                    accessibilityHint="Double tap to view plan details"
                    style={({ pressed }) => [
                      styles.planCard,
                      {
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View style={styles.planHeader}>
                      <View style={[styles.iconCircle, { backgroundColor: item.completed ? 'rgba(52, 211, 153, 0.15)' : 'rgba(139, 92, 246, 0.15)' }]}>
                        <Ionicons
                          name={item.completed ? 'checkmark-circle' : 'book-outline'}
                          size={22}
                          color={item.completed ? colors.success : colors.accent}
                        />
                      </View>
                      <Text
                        style={[styles.planTitle, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {getPlanTitle(item)}
                      </Text>
                    </View>

                    {getPlanDescription(item) ? (
                      <Text
                        style={[styles.planDescription, { color: colors.textSecondary }]}
                        numberOfLines={2}
                      >
                        {getPlanDescription(item)}
                      </Text>
                    ) : null}

                    {/* Progress bar */}
                    <View style={styles.progressContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          { backgroundColor: 'rgba(255, 255, 255, 0.06)' },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: item.completed
                                ? colors.success
                                : colors.accent,
                              width: `${progress}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[styles.progressLabel, { color: colors.textSecondary }]}
                      >
                        {item.completed
                          ? t('plans.completed')
                          : t('plans.progress', {
                              current: item.currentDay,
                              total: item.totalDays,
                            })}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  list: {
    paddingBottom: 16,
  },
  planCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: MIN_TOUCH_SIZE,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    marginLeft: 52,
  },
  progressContainer: {
    gap: 6,
    marginLeft: 52,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
  },
});
