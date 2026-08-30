import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';

/**
 * Global navigation ref.
 *
 * Lets non-component code (e.g. the voice controller) trigger navigation
 * from anywhere without having to plumb the `navigation` prop through.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type TabName = 'Home' | 'Favorites' | 'Plans' | 'Settings';

export function navigateToTab(tab: TabName): void {
  if (!navigationRef.isReady()) return;
  // @ts-expect-error nested navigator typing
  navigationRef.navigate('Main', { screen: tab });
}

export function navigateToVerse(params: {
  verseId?: string;
  reference?: string;
  autoPlay?: boolean;
}): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('VerseDetail', params);
}

export function navigateToVoiceCommands(): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('VoiceCommands');
}
