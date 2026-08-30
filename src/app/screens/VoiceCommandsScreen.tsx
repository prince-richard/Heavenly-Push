import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { VOICE_COMMANDS } from '@/services/speech/VoiceCommandParser';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import type { VoiceCommandInfo } from '@/types/speech';

const CATEGORY_INFO: Record<string, { title_en: string; title_ta: string; icon: keyof typeof Ionicons.glyphMap }> = {
  playback: { title_en: 'Playback & Reading', title_ta: 'ஒலிப்பதிவு & படித்தல்', icon: 'play-circle-outline' },
  save: { title_en: 'Save & Favorites', title_ta: 'சேமிப்பு & பிடித்தவை', icon: 'heart-outline' },
  navigation: { title_en: 'Navigation', title_ta: 'வழிசெலுத்தல்', icon: 'navigate-outline' },
  language: { title_en: 'Language', title_ta: 'மொழி', icon: 'language-outline' },
  search: { title_en: 'Search & Ask', title_ta: 'தேடல் & கேள்வி', icon: 'search-outline' },
  other: { title_en: 'Other', title_ta: 'மற்றவை', icon: 'ellipsis-horizontal-outline' },
};

const CATEGORY_ORDER = ['playback', 'save', 'navigation', 'search', 'language', 'other'];

function groupByCategory(commands: VoiceCommandInfo[]): Record<string, VoiceCommandInfo[]> {
  const groups: Record<string, VoiceCommandInfo[]> = {};
  for (const cmd of commands) {
    if (!groups[cmd.category]) groups[cmd.category] = [];
    groups[cmd.category].push(cmd);
  }
  return groups;
}

export function VoiceCommandsScreen() {
  const { colors } = useAccessibility();
  const lang = useSettingsStore((s) => s.primaryLanguage);
  const isTamil = lang === 'ta';

  const grouped = groupByCategory(VOICE_COMMANDS);

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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[styles.title, { color: colors.gold }]}
            accessibilityRole="header"
          >
            {isTamil ? 'குரல் கட்டளைகள்' : 'Voice Commands'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isTamil
              ? 'கீழே உள்ள கட்டளைகளை தமிழிலோ ஆங்கிலத்திலோ பேசுங்கள்'
              : 'Say any of the commands below in English or Tamil'}
          </Text>

          {CATEGORY_ORDER.map((cat) => {
            const commands = grouped[cat];
            if (!commands || commands.length === 0) return null;
            const info = CATEGORY_INFO[cat];

            return (
              <View key={cat} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Ionicons
                    name={info.icon}
                    size={22}
                    color={colors.gold}
                  />
                  <Text
                    style={[styles.categoryTitle, { color: colors.gold }]}
                    accessibilityRole="header"
                  >
                    {isTamil ? info.title_ta : info.title_en}
                  </Text>
                </View>

                {commands.map((cmd) => (
                  <View
                    key={cmd.command}
                    style={[
                      styles.commandCard,
                      {
                        backgroundColor: colors.cardElevated,
                        borderColor: colors.border,
                      },
                    ]}
                    accessible={true}
                    accessibilityLabel={`${isTamil ? cmd.description_ta : cmd.description_en}. ${
                      isTamil
                        ? `தமிழ்: ${cmd.tamilPhrases.map(p => p.trim()).join(', ')}. ஆங்கிலம்: ${cmd.englishPhrases.map(p => p.trim()).join(', ')}`
                        : `English: ${cmd.englishPhrases.map(p => p.trim()).join(', ')}. Tamil: ${cmd.tamilPhrases.map(p => p.trim()).join(', ')}`
                    }`}
                  >
                    <Text style={[styles.commandDesc, { color: colors.text }]}>
                      {isTamil ? cmd.description_ta : cmd.description_en}
                    </Text>

                    {/* Tamil phrases */}
                    <View style={styles.phrasesRow}>
                      <Text style={[styles.langLabel, { color: colors.accent }]}>
                        {isTamil ? 'தமிழ்' : 'Tamil'}:
                      </Text>
                      <View style={styles.pillsContainer}>
                        {cmd.tamilPhrases.map((phrase) => (
                          <View
                            key={phrase}
                            style={[
                              styles.phrasePill,
                              { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: colors.accent },
                            ]}
                          >
                            <Text style={[styles.phraseText, { color: colors.text }]}>
                              "{phrase.trim()}"
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* English phrases */}
                    <View style={styles.phrasesRow}>
                      <Text style={[styles.langLabel, { color: colors.gold }]}>
                        {isTamil ? 'ஆங்கிலம்' : 'English'}:
                      </Text>
                      <View style={styles.pillsContainer}>
                        {cmd.englishPhrases.map((phrase) => (
                          <View
                            key={phrase}
                            style={[
                              styles.phrasePill,
                              { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: colors.accent },
                            ]}
                          >
                            <Text style={[styles.phraseText, { color: colors.text }]}>
                              "{phrase.trim()}"
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          <View style={styles.tipBox}>
            <Ionicons name="bulb-outline" size={20} color={colors.gold} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {isTamil
                ? 'குறிப்பு: கட்டளைகள் பொருந்தாவிட்டால், உங்கள் கேள்வி தானாகவே AI க்கு அனுப்பப்படும்.'
                : 'Tip: If no command matches, your speech is automatically sent as a question to the AI.'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  commandCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  commandDesc: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 21,
  },
  phrasesRow: {
    marginBottom: 8,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  phrasePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  phraseText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
