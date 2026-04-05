import { Audio } from 'expo-av';
import { File as FSFile } from 'expo-file-system';
import { MAX_RECORDING_DURATION_S } from '@/constants/config';

/**
 * Audio recording service using expo-av.
 * Records in M4A/AAC format with a 120-second max duration.
 */

let recording: Audio.Recording | null = null;
let sound: Audio.Sound | null = null;
let recordingTimer: ReturnType<typeof setTimeout> | null = null;
let _isRecording = false;
let _isPlaying = false;

/**
 * Request audio recording permissions.
 * Returns true if granted, false otherwise.
 */
async function requestPermissions(): Promise<boolean> {
  try {
    const { granted } = await Audio.requestPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/**
 * Start a new audio recording.
 * Auto-stops after MAX_RECORDING_DURATION_S.
 */
async function startRecording(): Promise<void> {
  // Ensure we have permissions
  const granted = await requestPermissions();
  if (!granted) {
    throw new Error('Audio recording permission denied');
  }

  // Stop any existing recording
  if (_isRecording && recording) {
    await stopRecording();
  }

  // Stop any playing sound
  await stopPlayback();

  // Configure audio mode for recording
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording: newRecording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );

  recording = newRecording;
  _isRecording = true;

  // Auto-stop after max duration
  recordingTimer = setTimeout(
    () => {
      void stopRecording();
    },
    MAX_RECORDING_DURATION_S * 1000,
  );
}

/**
 * Stop the current recording and return the file URI and duration.
 */
async function stopRecording(): Promise<{ uri: string; duration: number }> {
  if (recordingTimer) {
    clearTimeout(recordingTimer);
    recordingTimer = null;
  }

  if (!recording) {
    throw new Error('No active recording to stop');
  }

  try {
    await recording.stopAndUnloadAsync();

    // Reset audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    const uri = recording.getURI();
    if (!uri) {
      throw new Error('Recording URI not available');
    }

    const status = await recording.getStatusAsync();
    const duration = Math.round((status.durationMillis ?? 0) / 1000);

    recording = null;
    _isRecording = false;

    return { uri, duration };
  } catch (error) {
    recording = null;
    _isRecording = false;
    throw error;
  }
}

/**
 * Play an audio file from the given URI.
 */
async function playRecording(uri: string): Promise<void> {
  // Stop any current playback
  await stopPlayback();

  const { sound: newSound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true },
  );

  sound = newSound;
  _isPlaying = true;

  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded && status.didJustFinish) {
      _isPlaying = false;
      void cleanupSound();
    }
  });
}

/**
 * Stop current audio playback.
 */
async function stopPlayback(): Promise<void> {
  await cleanupSound();
  _isPlaying = false;
}

/**
 * Delete an audio file at the given URI.
 */
async function deleteRecording(uri: string): Promise<void> {
  try {
    const file = new FSFile(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Swallow — file may already be deleted
  }
}

function isRecording(): boolean {
  return _isRecording;
}

function isPlaying(): boolean {
  return _isPlaying;
}

async function cleanupSound(): Promise<void> {
  if (sound) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {
      // Swallow cleanup errors
    }
    sound = null;
  }
}

export const audioRecordingService = {
  requestPermissions,
  startRecording,
  stopRecording,
  playRecording,
  stopPlayback,
  deleteRecording,
  isRecording,
  isPlaying,
};
