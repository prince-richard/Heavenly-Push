export type RootStackParamList = {
  Main: undefined;
  VerseDetail: { verseId: string; autoPlay?: boolean };
  PlanDetail: { planId: string };
};

export type TabParamList = {
  Home: undefined;
  Search: { query?: string };
  Favorites: undefined;
  Plans: undefined;
  Settings: undefined;
};
