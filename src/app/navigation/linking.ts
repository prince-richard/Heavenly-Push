import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['heavenlypush://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Search: 'search',
          Favorites: 'favorites',
          Plans: 'plans',
          Settings: 'settings',
        },
      },
      VerseDetail: 'verse/:verseId',
      PlanDetail: 'plan/:planId',
    },
  },
};
