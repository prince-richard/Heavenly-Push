import React, { useCallback, useState } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { HighContrastToggle } from '@/components/settings/HighContrastToggle';
import { TtsSpeedControl } from '@/components/audio/TtsSpeedControl';
import { PermissionPromptCard } from '@/components/common/PermissionPromptCard';
import { SectionHeader } from '@/components/common/SectionHeader';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import { NotificationService } from '@/services/notifications/NotificationService';
import { isWeb } from '@/utils/platform';
import type { SupportedLanguage } from '@/types/models';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useAccessibility();

  const primaryLanguage = useSettingsStore((s) => s.primaryLanguage);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const toggleHaptics = useSettingsStore((s) => s.toggleHaptics);
  const shakeToSpeakEnabled = useSettingsStore((s) => s.shakeToSpeakEnabled);
  const toggleShakeToSpeak = useSettingsStore((s) => s.toggleShakeToSpeak);
  const dailyPushEnabled = useSettingsStore((s) => s.dailyPushEnabled);
  const setDailyPushEnabled = useSettingsStore((s) => s.setDailyPushEnabled);
  const dailyPushTime = useSettingsStore((s) => s.dailyPushTime);
  const autoPlayVerseOnOpen = useSettingsStore((s) => s.autoPlayVerseOnOpen);
  const toggleAutoPlay = useSettingsStore((s) => s.toggleAutoPlay);
  const dynamicTextScale = useSettingsStore((s) => s.dynamicTextScale);
  const toggleDynamicTextScale = useSettingsStore((s) => s.toggleDynamicTextScale);

  const [notifPermDenied, setNotifPermDenied] = useState(false);

  const handleDailyPushToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const granted = await NotificationService.requestPermissions();
        if (!granted) {
          setNotifPermDenied(true);
          return;
        }
        setNotifPermDenied(false);
        setDailyPushEnabled(true);
      } else {
        await NotificationService.cancelDailyVerse();
        setDailyPushEnabled(false);
      }
    },
    [setDailyPushEnabled]
  );

  const handleLanguageSelect = useCallback(
    (lang: SupportedLanguage) => {
      setLanguage(lang);
    },
    [setLanguage]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[styles.title, { color: colors.text }]}
          accessibilityRole="header"
        >
          {t('settings.title')}
        </Text>

        {/* Language */}
        <SectionHeader title={t('settings.language')} />
        <View style={styles.languageRow}>
          <PrimaryButton
            title={t('settings.languageEn')}
            onPress={() => handleLanguageSelect('en')}
            style={{
              ...styles.langButton,
              backgroundColor: primaryLanguage === 'en' ? colors.accent : colors.card,
            }}
            textStyle={{
              color: primaryLanguage === 'en' ? colors.background : colors.text,
            }}
            accessibilityLabel={`${t('settings.languageEn')}${primaryLanguage === 'en' ? ', selected' : ''}`}
          />
          <PrimaryButton
            title={t('settings.languageTa')}
            onPress={() => handleLanguageSelect('ta')}
            style={{
              ...styles.langButton,
              backgroundColor: primaryLanguage === 'ta' ? colors.accent : colors.card,
            }}
            textStyle={{
              color: primaryLanguage === 'ta' ? colors.background : colors.text,
            }}
            accessibilityLabel={`${t('settings.languageTa')}${primaryLanguage === 'ta' ? ', selected' : ''}`}
          />
        </View>

        {/* Appearance */}
        <SectionHeader title={t('settings.appearance')} />
        <HighContrastToggle />
        <SettingRow
          label={t('settings.dynamicText')}
          value={dynamicTextScale}
          onToggle={toggleDynamicTextScale}
          colors={colors}
        />

        {/* Audio & Voice */}
        <SectionHeader title={t('settings.audio')} />
        <View style={styles.ttsSpeedRow}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t('settings.ttsSpeed')}
          </Text>
          <TtsSpeedControl />
        </View>
        <SettingRow
          label={t('settings.autoPlay')}
          value={autoPlayVerseOnOpen}
          onToggle={toggleAutoPlay}
          colors={colors}
        />
        {!isWeb() && (
          <SettingRow
            label={t('settings.haptics')}
            value={hapticsEnabled}
            onToggle={toggleHaptics}
            colors={colors}
          />
        )}
        {!isWeb() && (
          <SettingRow
            label={t('settings.shakeToSpeak')}
            value={shakeToSpeakEnabled}
            onToggle={toggleShakeToSpeak}
            colors={colors}
          />
        )}

        {/* Notifications */}
        {!isWeb() && (
          <>
            <SectionHeader title={t('settings.notifications')} />
            <SettingRow
              label={t('settings.dailyPush')}
              value={dailyPushEnabled}
              onToggle={handleDailyPushToggle}
              colors={colors}
            />
            {dailyPushEnabled && (
              <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t('settings.dailyPushTime')}
                </Text>
                <Text style={[styles.timeValue, { color: colors.accent }]}>
                  {dailyPushTime}
                </Text>
              </View>
            )}
            {notifPermDenied && (
              <PermissionPromptCard
                icon="notifications-off-outline"
                title={t('permissions.notificationTitle')}
                message={t('permissions.notificationMessage')}
                actionLabel={t('permissions.notificationAction')}
              />
            )}
          </>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable setting toggle row
interface SettingRowProps {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  colors: ReturnType<typeof useAccessibility>['colors'];
}

function SettingRow({ label, value, onToggle, colors }: SettingRowProps) {
  return (
    <View style={[settingStyles.row, { borderBottomColor: colors.border }]}>
      <Text style={[settingStyles.label, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.placeholder, true: colors.accent }}
        thumbColor={colors.background}
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        style={{ minWidth: MIN_TOUCH_SIZE, minHeight: MIN_TOUCH_SIZE }}
      />
    </View>
  );
}

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_SIZE,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
});

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  langButton: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_SIZE,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  ttsSpeedRow: {
    paddingVertical: 12,
    gap: 8,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
  },
});
