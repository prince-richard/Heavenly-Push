import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  // Load plans — for now use default plans JSON; at integration, PlanRepository will be used
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
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
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View style={styles.planHeader}>
                    <Ionicons
                      name={item.completed ? 'checkmark-circle' : 'book-outline'}
                      size={24}
                      color={item.completed ? colors.success : colors.accent}
                    />
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
                        { backgroundColor: colors.inputBackground },
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
  },
  list: {
    paddingBottom: 16,
  },
  planCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: MIN_TOUCH_SIZE,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
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
  },
  progressContainer: {
    gap: 6,
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
