/**
 * Maps mood keywords (English) to theme tags for mood-based search.
 */
export const moodToThemes: Record<string, string[]> = {
  sad: ['comfort', 'hope', 'peace'],
  anxious: ['peace', 'trust', 'faith'],
  afraid: ['courage', 'protection', 'faith'],
  lonely: ['presence', 'love', 'comfort'],
  thankful: ['praise', 'gratitude', 'joy'],
  guilty: ['forgiveness', 'grace', 'mercy'],
  angry: ['peace', 'patience', 'forgiveness'],
  worried: ['trust', 'faith', 'peace'],
  hopeless: ['hope', 'encouragement', 'strength'],
  grieving: ['comfort', 'hope', 'presence'],
  depressed: ['hope', 'comfort', 'joy'],
  stressed: ['peace', 'trust', 'comfort'],
  happy: ['praise', 'joy', 'gratitude'],
  joyful: ['praise', 'joy', 'gratitude'],
  lost: ['guidance', 'wisdom', 'faith'],
  weak: ['strength', 'courage', 'faith'],
  tired: ['comfort', 'strength', 'peace'],
  scared: ['courage', 'protection', 'faith'],
  confused: ['wisdom', 'guidance', 'peace'],
  hurt: ['healing', 'comfort', 'forgiveness'],
};

/**
 * Maps Tamil mood keywords to the same English theme tags.
 */
export const tamilMoodToThemes: Record<string, string[]> = {
  // sad
  '\u0b95\u0bb5\u0bb2\u0bc8': ['comfort', 'hope', 'peace'],
  '\u0b9a\u0bcb\u0b95\u0bae\u0bcd': ['comfort', 'hope', 'peace'],
  // anxious
  '\u0b95\u0bb5\u0bb2\u0bc8\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0b95\u0bbf\u0bb1\u0bc7\u0ba9\u0bcd': ['peace', 'trust', 'faith'],
  // afraid
  '\u0baa\u0baf\u0bae\u0bcd': ['courage', 'protection', 'faith'],
  // lonely
  '\u0ba4\u0ba9\u0bbf\u0bae\u0bc8': ['presence', 'love', 'comfort'],
  // thankful
  '\u0ba8\u0ba9\u0bcd\u0bb1\u0bbf': ['praise', 'gratitude', 'joy'],
  // guilty
  '\u0b95\u0bc1\u0bb1\u0bcd\u0bb1\u0bae\u0bcd': ['forgiveness', 'grace', 'mercy'],
  // angry
  '\u0b95\u0bcb\u0baa\u0bae\u0bcd': ['peace', 'patience', 'forgiveness'],
  // worried (கவலைப்படுதல் - worrying)
  '\u0b95\u0bb5\u0bb2\u0bc8\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0ba4\u0bb2\u0bcd': ['trust', 'faith', 'peace'],
  // hopeless
  '\u0ba8\u0bae\u0bcd\u0baa\u0bbf\u0b95\u0bcd\u0b95\u0bc8\u0baf\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8': ['hope', 'encouragement', 'strength'],
  // peace
  '\u0b85\u0bae\u0bc8\u0ba4\u0bbf': ['peace', 'trust', 'comfort'],
  // love
  '\u0b85\u0ba9\u0bcd\u0baa\u0bc1': ['love', 'grace', 'mercy'],
  // faith
  '\u0bb5\u0bbf\u0b9a\u0bc1\u0bb5\u0bbe\u0b9a\u0bae\u0bcd': ['faith', 'trust', 'hope'],
  // healing
  '\u0b9a\u0bc1\u0b95\u0bae\u0bcd': ['healing', 'comfort', 'hope'],
};

/**
 * Mood-related phrases in English that indicate emotional state.
 */
export const moodPhrases: Record<string, string[]> = {
  sad: ['feeling sad', 'i am sad', 'feeling down', 'feeling blue'],
  anxious: ['feeling anxious', 'i am anxious', 'feeling nervous'],
  afraid: ['feeling afraid', 'i am afraid', 'i am scared', 'feeling scared'],
  lonely: ['feeling lonely', 'i am lonely', 'feeling alone'],
  thankful: ['feeling thankful', 'i am thankful', 'feeling grateful'],
  guilty: ['feeling guilty', 'i am guilty', 'feeling ashamed'],
  angry: ['feeling angry', 'i am angry', 'feeling mad'],
  worried: ['feeling worried', 'i am worried'],
  hopeless: ['feeling hopeless', 'no hope', 'feeling desperate'],
  grieving: ['feeling grief', 'i am grieving', 'lost someone'],
  depressed: ['feeling depressed', 'i am depressed'],
  stressed: ['feeling stressed', 'i am stressed', 'under pressure'],
  happy: ['feeling happy', 'i am happy', 'feeling great'],
  tired: ['feeling tired', 'i am tired', 'feeling exhausted'],
  weak: ['feeling weak', 'i am weak'],
  hurt: ['feeling hurt', 'i am hurt', 'in pain'],
  confused: ['feeling confused', 'i am confused', 'feeling lost'],
  lost: ['feeling lost', 'i am lost'],
};
