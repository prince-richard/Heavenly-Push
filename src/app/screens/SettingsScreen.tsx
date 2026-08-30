import React, { useCallback, useState } from 'react';
import { View, Text, Image, Switch, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
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

  const authMethod = useAuthStore((s) => s.authMethod);
  const authUser = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={colors.backdropGradient as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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

          {/* Account */}
          <SectionHeader title={t('settings.account')} />
          <View style={[styles.accountCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <View style={styles.accountInfo}>
              {authUser?.photoUrl ? (
                <Image
                  source={{ uri: authUser.photoUrl }}
                  style={[styles.avatar, { borderColor: colors.accent }]}
                  accessibilityLabel="Profile photo"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                </View>
              )}
              <View style={styles.accountText}>
                <Text style={[styles.accountName, { color: colors.text }]}>
                  {authUser?.displayName ?? 'Guest'}
                </Text>
                {authUser?.email ? (
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                    {authUser.email}
                  </Text>
                ) : (
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                    {authMethod === 'guest' ? t('auth.guestUser') : ''}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Language */}
          <SectionHeader title={t('settings.language')} />
          <View style={styles.languageRow}>
            <PrimaryButton
              title={t('settings.languageEn')}
              onPress={() => handleLanguageSelect('en')}
              style={{
                ...styles.langButton,
                backgroundColor: primaryLanguage === 'en' ? colors.accent : colors.glass,
                borderWidth: 1,
                borderColor: primaryLanguage === 'en' ? colors.accent : colors.glassBorder,
              }}
              textStyle={{
                color: primaryLanguage === 'en' ? '#FFFFFF' : colors.text,
              }}
              accessibilityLabel={`${t('settings.languageEn')}${primaryLanguage === 'en' ? ', selected' : ''}`}
            />
            <PrimaryButton
              title={t('settings.languageTa')}
              onPress={() => handleLanguageSelect('ta')}
              style={{
                ...styles.langButton,
                backgroundColor: primaryLanguage === 'ta' ? colors.accent : colors.glass,
                borderWidth: 1,
                borderColor: primaryLanguage === 'ta' ? colors.accent : colors.glassBorder,
              }}
              textStyle={{
                color: primaryLanguage === 'ta' ? '#FFFFFF' : colors.text,
              }}
              accessibilityLabel={`${t('settings.languageTa')}${primaryLanguage === 'ta' ? ', selected' : ''}`}
            />
          </View>

          {/* Appearance */}
          <SectionHeader title={t('settings.appearance')} />
          <View style={[styles.sectionCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
            <HighContrastToggle />
            <SettingRow
              label={t('settings.dynamicText')}
              value={dynamicTextScale}
              onToggle={toggleDynamicTextScale}
              colors={colors}
            />
          </View>

          {/* Audio & Voice */}
          <SectionHeader title={t('settings.audio')} />
          <View style={[styles.sectionCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
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
                isLast
              />
            )}
          </View>

          {/* Notifications */}
          {!isWeb() && (
            <>
              <SectionHeader title={t('settings.notifications')} />
              <View style={[styles.sectionCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <SettingRow
                  label={t('settings.dailyPush')}
                  value={dailyPushEnabled}
                  onToggle={handleDailyPushToggle}
                  colors={colors}
                />
                {dailyPushEnabled && (
                  <View style={[styles.settingRow]}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {t('settings.dailyPushTime')}
                    </Text>
                    <Text style={[styles.timeValue, { color: colors.gold }]}>
                      {dailyPushTime}
                    </Text>
                  </View>
                )}
              </View>
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

          {/* Sign Out */}
          <View style={styles.signOutContainer}>
            <PrimaryButton
              title={t('settings.signOut')}
              onPress={signOut}
              style={{ backgroundColor: 'rgba(251, 113, 133, 0.2)', borderWidth: 1, borderColor: colors.error }}
              textStyle={{ color: colors.error }}
              accessibilityHint="Sign out of your account"
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

interface SettingRowProps {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  colors: ReturnType<typeof useAccessibility>['colors'];
  isLast?: boolean;
}

function SettingRow({ label, value, onToggle, colors, isLast }: SettingRowProps) {
  return (
    <View style={[settingStyles.row, !isLast && { borderBottomColor: colors.glassBorder, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[settingStyles.label, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(155, 142, 196, 0.3)', true: colors.accent }}
        thumbColor={value ? '#FFFFFF' : 'rgba(255,255,255,0.7)'}
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
    letterSpacing: 0.3,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  langButton: {
    flex: 1,
    borderRadius: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
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
  accountCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 14,
  },
  signOutContainer: {
    marginTop: 24,
  },
});
