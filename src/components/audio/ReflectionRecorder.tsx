import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { IconButtonAccessible } from '@/components/common/IconButtonAccessible';
import { SectionHeader } from '@/components/common/SectionHeader';
import { MIN_TOUCH_SIZE } from '@/constants/accessibility';
import { generateId } from '@/utils/id';
import type { VoiceReflection } from '@/types/models';
import { audioRecordingService } from '@/services/audio/AudioRecordingService';
import { fileStorageService } from '@/services/storage/FileStorageService';
import { getDatabase } from '@/db/database';
import { ReflectionRepository } from '@/db/repositories/ReflectionRepository';

type RecorderState = 'IDLE' | 'RECORDING' | 'PREVIEW' | 'SAVED';

interface ReflectionRecorderProps {
  verseId: string;
}

export function ReflectionRecorder({ verseId }: ReflectionRecorderProps) {
  const { t } = useTranslation();
  const { colors } = useAccessibility();
  const [state, setState] = useState<RecorderState>('IDLE');
  const [reflections, setReflections] = useState<VoiceReflection[]>([]);
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Load existing reflections
  useEffect(() => {
    try {
      const db = getDatabase();
      const repo = new ReflectionRepository(db);
      const existing = repo.getByVerseId(verseId);
      setReflections(existing);
    } catch {
      setReflections([]);
    }
  }, [verseId]);

  const handleStartRecording = useCallback(async () => {
    try {
      await audioRecordingService.startRecording();
      setState('RECORDING');
      setRecordingDuration(0);
    } catch {
      // Permission denied or error
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    try {
      const result = await audioRecordingService.stopRecording();
      if (result) {
        setCurrentUri(result.uri);
        setRecordingDuration(result.duration);
        setState('PREVIEW');
      } else {
        setState('IDLE');
      }
    } catch {
      setState('IDLE');
    }
  }, []);

  const handlePreviewPlay = useCallback(async () => {
    if (currentUri) {
      try {
        await audioRecordingService.playRecording(currentUri);
      } catch {
        // Playback error
      }
    }
  }, [currentUri]);

  const handleSave = useCallback(async () => {
    if (!currentUri) return;

    try {
      const noteId = generateId();
      const savedUri = await fileStorageService.saveReflection(
        verseId,
        noteId,
        currentUri
      );

      const reflection: VoiceReflection = {
        noteId,
        verseId,
        audioFileUri: savedUri,
        durationSeconds: recordingDuration,
        createdAt: new Date().toISOString(),
      };

      const db = getDatabase();
      const repo = new ReflectionRepository(db);
      repo.save(reflection);

      setReflections((prev) => [reflection, ...prev]);
      setCurrentUri(null);
      setState('SAVED');

      // Reset to IDLE after brief delay
      setTimeout(() => setState('IDLE'), 1500);
    } catch {
      // Save error
    }
  }, [currentUri, verseId, recordingDuration]);

  const handleDiscard = useCallback(() => {
    setCurrentUri(null);
    setState('IDLE');
  }, []);

  const handlePlayReflection = useCallback(
    async (reflection: VoiceReflection) => {
      try {
        setPlayingId(reflection.noteId);
        await audioRecordingService.playRecording(reflection.audioFileUri);
        setPlayingId(null);
      } catch {
        setPlayingId(null);
      }
    },
    []
  );

  const handleDeleteReflection = useCallback(
    async (noteId: string) => {
      try {
        const db = getDatabase();
        const repo = new ReflectionRepository(db);
        repo.delete(noteId);

        const reflection = reflections.find((r) => r.noteId === noteId);
        if (reflection) {
          await fileStorageService.deleteReflection(verseId, noteId);
        }

        setReflections((prev) => prev.filter((r) => r.noteId !== noteId));
      } catch {
        // Delete error
      }
    },
    [reflections]
  );

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <SectionHeader title={t('verse.reflection')} />

      {/* Recording controls */}
      <View style={styles.recordingArea}>
        {state === 'IDLE' && (
          <PrimaryButton
            title={t('verse.reflection')}
            onPress={handleStartRecording}
            accessibilityHint="Start recording your reflection"
          />
        )}

        {state === 'RECORDING' && (
          <View style={styles.recordingRow}>
            <View
              style={[styles.recordingIndicator, { backgroundColor: colors.error }]}
            />
            <Text style={[styles.recordingText, { color: colors.error }]}>
              Recording...
            </Text>
            <IconButtonAccessible
              iconName="stop-circle"
              onPress={handleStopRecording}
              accessibilityLabel="Stop recording"
              size={36}
              color={colors.error}
            />
          </View>
        )}

        {state === 'PREVIEW' && (
          <View style={styles.previewRow}>
            <IconButtonAccessible
              iconName="play-circle"
              onPress={handlePreviewPlay}
              accessibilityLabel="Preview recording"
              size={32}
              color={colors.accent}
            />
            <Text style={[styles.durationText, { color: colors.text }]}>
              {formatDuration(recordingDuration)}
            </Text>
            <PrimaryButton
              title={t('common.save')}
              onPress={handleSave}
              style={styles.actionButton}
            />
            <PrimaryButton
              title={t('common.cancel')}
              onPress={handleDiscard}
              style={{ ...styles.actionButton, backgroundColor: colors.placeholder }}
            />
          </View>
        )}

        {state === 'SAVED' && (
          <View style={styles.savedRow}>
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
            <Text style={[styles.savedText, { color: colors.success }]}>
              Saved!
            </Text>
          </View>
        )}
      </View>

      {/* Existing reflections */}
      {reflections.length > 0 && (
        <FlatList
          data={reflections}
          keyExtractor={(item) => item.noteId}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.reflectionItem,
                { borderColor: colors.border },
              ]}
            >
              <Pressable
                onPress={() => handlePlayReflection(item)}
                accessibilityRole="button"
                accessibilityLabel={`Play reflection from ${new Date(item.createdAt).toLocaleDateString()}, ${formatDuration(item.durationSeconds)}`}
                style={styles.reflectionPlayArea}
              >
                <Ionicons
                  name={playingId === item.noteId ? 'pause-circle' : 'play-circle'}
                  size={28}
                  color={colors.accent}
                />
                <View style={styles.reflectionInfo}>
                  <Text style={[styles.reflectionDate, { color: colors.text }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  <Text
                    style={[
                      styles.reflectionDuration,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatDuration(item.durationSeconds)}
                  </Text>
                </View>
              </Pressable>
              <IconButtonAccessible
                iconName="trash-outline"
                onPress={() => handleDeleteReflection(item.noteId)}
                accessibilityLabel={`Delete reflection from ${new Date(item.createdAt).toLocaleDateString()}`}
                color={colors.error}
                size={22}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  recordingArea: {
    marginBottom: 12,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: MIN_TOUCH_SIZE,
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  durationText: {
    fontSize: 16,
    flex: 1,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: MIN_TOUCH_SIZE,
  },
  savedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reflectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_SIZE,
  },
  reflectionPlayArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: MIN_TOUCH_SIZE,
  },
  reflectionInfo: {
    flex: 1,
  },
  reflectionDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  reflectionDuration: {
    fontSize: 12,
    marginTop: 2,
  },
});
