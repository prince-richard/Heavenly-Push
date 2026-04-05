/**
 * Master list of all theme tags used across the app.
 */
export const THEME_TAGS = [
  'love',
  'hope',
  'faith',
  'comfort',
  'peace',
  'courage',
  'forgiveness',
  'praise',
  'healing',
  'trust',
  'salvation',
  'grace',
  'mercy',
  'joy',
  'strength',
  'patience',
  'wisdom',
  'protection',
  'presence',
  'gratitude',
  'encouragement',
  'obedience',
  'prayer',
  'provision',
  'guidance',
] as const;

export type ThemeTag = (typeof THEME_TAGS)[number];
