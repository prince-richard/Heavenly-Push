import {
  moodToThemes,
  tamilMoodToThemes,
  moodPhrases,
} from '../../data/dictionaries/mood-themes';

/**
 * Checks if the query contains mood-related keywords and returns
 * the corresponding theme tags for searching.
 *
 * Supports both English and Tamil mood keywords.
 */
export function mapMoodToThemes(query: string): string[] {
  const lower = query.toLowerCase();

  // Check English mood phrases first (more specific)
  for (const [mood, phrases] of Object.entries(moodPhrases)) {
    for (const phrase of phrases) {
      if (lower.includes(phrase)) {
        return moodToThemes[mood] ?? [];
      }
    }
  }

  // Check individual English mood keywords
  for (const [mood, themes] of Object.entries(moodToThemes)) {
    if (lower.includes(mood)) {
      return themes;
    }
  }

  // Check Tamil mood keywords
  for (const [tamilMood, themes] of Object.entries(tamilMoodToThemes)) {
    if (query.includes(tamilMood)) {
      return themes;
    }
  }

  return [];
}
