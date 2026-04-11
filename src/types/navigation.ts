export type RootStackParamList = {
  Main: undefined;
  VerseDetail: { verseId?: string; reference?: string; autoPlay?: boolean };
  PlanDetail: { planId: string };
};

export type TabParamList = {
  Home: undefined;
  Search: { query?: string; voiceActivated?: boolean };
  Favorites: undefined;
  Plans: undefined;
  Settings: undefined;
};
