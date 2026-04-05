import { Platform } from 'react-native';
import { isWeb } from '@/utils/platform';

// Conditionally import expo-notifications (not available on web)
let Notifications: typeof import('expo-notifications') | null = null;
try {
  if (!isWeb()) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
  }
} catch {
  // expo-notifications not available
}

const DAILY_VERSE_NOTIFICATION_ID = 'daily-verse';

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Notifications || isWeb()) {
      return false;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') {
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  async scheduleDailyVerse(
    hour: number,
    minute: number,
    verseId: string,
    text: string
  ): Promise<void> {
    if (!Notifications || isWeb()) {
      return;
    }

    try {
      // Cancel any existing daily verse notification first
      await this.cancelDailyVerse();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Verse',
          body: text.length > 100 ? text.substring(0, 100) + '...' : text,
          data: { verseId },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
        identifier: DAILY_VERSE_NOTIFICATION_ID,
      });
    } catch {
      // Scheduling failed
    }
  },

  async cancelDailyVerse(): Promise<void> {
    if (!Notifications || isWeb()) {
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(
        DAILY_VERSE_NOTIFICATION_ID
      );
    } catch {
      // Cancellation failed — might not exist
    }
  },

  handleNotificationResponse(
    response: { notification?: { request?: { content?: { data?: Record<string, unknown> } } } } | null
  ): { verseId: string } | null {
    if (!response) {
      return null;
    }

    const data = response.notification?.request?.content?.data;
    if (data && typeof data.verseId === 'string') {
      return { verseId: data.verseId };
    }

    return null;
  },

  /**
   * Set up notification response listener.
   * Returns a cleanup function.
   */
  addNotificationResponseListener(
    callback: (verseId: string) => void
  ): () => void {
    if (!Notifications || isWeb()) {
      return () => {};
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response: { notification?: { request?: { content?: { data?: Record<string, unknown> } } } }) => {
        const result = this.handleNotificationResponse(response);
        if (result) {
          callback(result.verseId);
        }
      }
    );

    return () => subscription.remove();
  },
};
