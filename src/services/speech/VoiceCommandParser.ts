import type { ParsedVoiceCommand, VoiceCommand, VoiceCommandInfo } from '@/types/speech';

interface CommandPattern {
  prefixes: string[];
  command: VoiceCommand;
  hasArgs: boolean;
}

/**
 * All voice commands with their English and Tamil phrases, descriptions,
 * and categories. This data is used both for parsing AND for the help screen.
 */
export const VOICE_COMMANDS: VoiceCommandInfo[] = [
  // === PLAYBACK ===
  {
    command: 'repeat',
    englishPhrases: ['repeat', 'again', 'replay', 'read again', 'say again', 'repeat all'],
    tamilPhrases: ['மீண்டும்', 'மறுபடி', 'மீண்டும் படி', 'மறுபடி சொல்'],
    description_en: 'Repeat the last answer or verse from the beginning',
    description_ta: 'கடைசி பதிலை அல்லது வசனத்தை மீண்டும் படிக்கவும்',
    category: 'playback',
  },
  {
    command: 'repeatFrom',
    englishPhrases: ['repeat from ', 'start from ', 'read from '],
    tamilPhrases: ['இங்கிருந்து படி ', 'இதிலிருந்து படி '],
    description_en: 'Repeat reading from a specific verse (e.g., "repeat from John 3:16")',
    description_ta: 'ஒரு குறிப்பிட்ட வசனத்திலிருந்து படிக்கவும் (எ.கா., "இங்கிருந்து படி யோவான் 3:16")',
    category: 'playback',
  },
  {
    command: 'repeatVerse',
    englishPhrases: ['repeat verse ', 'read verse ', 'say verse '],
    tamilPhrases: ['வசனம் படி ', 'வசனம் சொல் '],
    description_en: 'Read a specific verse (e.g., "read verse 3" or "read verse John 3:16")',
    description_ta: 'ஒரு குறிப்பிட்ட வசனத்தை படிக்கவும் (எ.கா., "வசனம் படி 3")',
    category: 'playback',
  },
  {
    command: 'read',
    englishPhrases: ['read this', 'read the verse', 'read it'],
    tamilPhrases: ['படி', 'வசனம் படி', 'இதை படி'],
    description_en: 'Read the current verse aloud',
    description_ta: 'தற்போதைய வசனத்தை சத்தமாக படிக்கவும்',
    category: 'playback',
  },
  {
    command: 'readContext',
    englishPhrases: ['read context', 'show context', 'surrounding verses'],
    tamilPhrases: ['சூழல் படி', 'சுற்றிலுள்ள வசனங்கள்'],
    description_en: 'Read surrounding verses for context',
    description_ta: 'சூழல் புரிய அருகிலுள்ள வசனங்களை படிக்கவும்',
    category: 'playback',
  },
  {
    command: 'stop',
    englishPhrases: ['stop', 'pause', 'quiet', 'be quiet', 'silence'],
    tamilPhrases: ['நிறுத்து', 'அமைதி', 'நிறுத்தி'],
    description_en: 'Stop reading aloud',
    description_ta: 'படிப்பதை நிறுத்தவும்',
    category: 'playback',
  },
  {
    command: 'slowDown',
    englishPhrases: ['slow down', 'slower', 'speak slowly'],
    tamilPhrases: ['மெதுவாக', 'மெதுவாக படி'],
    description_en: 'Decrease reading speed',
    description_ta: 'படிக்கும் வேகத்தை குறைக்கவும்',
    category: 'playback',
  },
  {
    command: 'speedUp',
    englishPhrases: ['speed up', 'faster', 'speak faster'],
    tamilPhrases: ['வேகமாக', 'வேகமாக படி'],
    description_en: 'Increase reading speed',
    description_ta: 'படிக்கும் வேகத்தை அதிகரிக்கவும்',
    category: 'playback',
  },
  {
    command: 'nextVerse',
    englishPhrases: ['next', 'next verse', 'continue'],
    tamilPhrases: ['அடுத்தது', 'அடுத்த வசனம்', 'தொடர்'],
    description_en: 'Go to the next verse',
    description_ta: 'அடுத்த வசனத்திற்கு செல்லவும்',
    category: 'playback',
  },
  {
    command: 'previousVerse',
    englishPhrases: ['previous', 'previous verse', 'go back'],
    tamilPhrases: ['முந்தையது', 'முந்தைய வசனம்', 'பின் செல்'],
    description_en: 'Go to the previous verse',
    description_ta: 'முந்தைய வசனத்திற்கு செல்லவும்',
    category: 'playback',
  },

  // === SAVE ===
  {
    command: 'saveVerse',
    englishPhrases: ['save this', 'save verse', 'save it', 'bookmark this', 'favorite this', 'add to favorites'],
    tamilPhrases: ['சேமி', 'இதை சேமி', 'புக்மார்க்', 'பிடித்தவையில் சேர்', 'சேமித்து வை'],
    description_en: 'Save the current verse to favorites',
    description_ta: 'தற்போதைய வசனத்தை பிடித்தவையில் சேமிக்கவும்',
    category: 'save',
  },
  {
    command: 'listSaved',
    englishPhrases: ['list saved', 'show saved', 'my saved verses', 'list favorites', 'show bookmarks'],
    tamilPhrases: ['சேமித்தவை காட்டு', 'பிடித்தவை காட்டு', 'என் சேமிப்புகள்'],
    description_en: 'Show all saved/favorite verses',
    description_ta: 'சேமிக்கப்பட்ட அனைத்து வசனங்களையும் காட்டவும்',
    category: 'save',
  },
  {
    command: 'readSaved',
    englishPhrases: ['read saved', 'read favorites', 'read my favorites', 'play saved'],
    tamilPhrases: ['சேமித்தவை படி', 'பிடித்தவை படி'],
    description_en: 'Read all saved verses aloud one by one',
    description_ta: 'சேமிக்கப்பட்ட வசனங்களை ஒவ்வொன்றாக படிக்கவும்',
    category: 'save',
  },

  // === NAVIGATION ===
  {
    command: 'openFavorites',
    englishPhrases: ['open favorites', 'my favorites', 'bookmarks', 'show favorites', 'go to favorites'],
    tamilPhrases: ['பிடித்தவை', 'பிடித்தவை திற', 'பிடித்தவைக்கு செல்'],
    description_en: 'Open the Favorites page',
    description_ta: 'பிடித்தவை பக்கத்தை திறக்கவும்',
    category: 'navigation',
  },
  {
    command: 'openHome',
    englishPhrases: ['go home', 'open home', 'home screen', 'home'],
    tamilPhrases: ['முகப்பு', 'முகப்புக்கு செல்'],
    description_en: 'Go to the Home screen',
    description_ta: 'முகப்பு பக்கத்திற்கு செல்லவும்',
    category: 'navigation',
  },
  {
    command: 'openSettings',
    englishPhrases: ['open settings', 'go to settings', 'show settings', 'settings'],
    tamilPhrases: ['அமைப்புகள்', 'அமைப்புகள் திற'],
    description_en: 'Open Settings',
    description_ta: 'அமைப்புகளை திறக்கவும்',
    category: 'navigation',
  },
  {
    command: 'openVoiceHelp',
    englishPhrases: ['voice commands', 'show commands', 'what can i say', 'help commands', 'voice help'],
    tamilPhrases: ['குரல் கட்டளைகள்', 'கட்டளைகள் காட்டு', 'என்ன சொல்லலாம்', 'உதவி'],
    description_en: 'Show the list of voice commands',
    description_ta: 'குரல் கட்டளைகளின் பட்டியலை காட்டவும்',
    category: 'navigation',
  },
  {
    command: 'dailyVerse',
    englishPhrases: ['daily verse', 'verse of the day', "today's verse"],
    tamilPhrases: ['இன்றைய வசனம்', 'நாளின் வசனம்'],
    description_en: 'Hear the daily verse',
    description_ta: 'இன்றைய வசனத்தை கேளுங்கள்',
    category: 'navigation',
  },

  // === LANGUAGE ===
  {
    command: 'speakEnglish',
    englishPhrases: ['speak in english', 'switch to english', 'english please', 'use english'],
    tamilPhrases: ['ஆங்கிலம்', 'ஆங்கிலத்தில் பேசு'],
    description_en: 'Switch to English',
    description_ta: 'ஆங்கிலத்திற்கு மாறவும்',
    category: 'language',
  },
  {
    command: 'speakTamil',
    englishPhrases: ['speak in tamil', 'switch to tamil', 'tamil please', 'use tamil'],
    tamilPhrases: ['தமிழில் பேசு', 'தமிழ்', 'தமிழுக்கு மாறு'],
    description_en: 'Switch to Tamil',
    description_ta: 'தமிழுக்கு மாறவும்',
    category: 'language',
  },

  // === SEARCH ===
  {
    command: 'ask',
    englishPhrases: ['ask ', 'tell me ', 'what does the bible say about ', 'what does the bible say '],
    tamilPhrases: ['கேள் ', 'சொல் ', 'வேதாகமம் என்ன சொல்கிறது '],
    description_en: 'Ask a question about the Bible',
    description_ta: 'வேதாகமத்தைப் பற்றி கேள்வி கேளுங்கள்',
    category: 'search',
  },
  {
    command: 'search',
    englishPhrases: ['search for ', 'search ', 'find '],
    tamilPhrases: ['தேடு ', 'கண்டுபிடி '],
    description_en: 'Search for verses about a topic',
    description_ta: 'ஒரு தலைப்பைப் பற்றிய வசனங்களை தேடுங்கள்',
    category: 'search',
  },
  {
    command: 'searchInTamil',
    englishPhrases: ['search in tamil ', 'tamil search '],
    tamilPhrases: ['தமிழில் தேடு '],
    description_en: 'Search in Tamil',
    description_ta: 'தமிழில் தேடுங்கள்',
    category: 'search',
  },
  {
    command: 'searchInEnglish',
    englishPhrases: ['search in english ', 'english search '],
    tamilPhrases: ['ஆங்கிலத்தில் தேடு '],
    description_en: 'Search in English',
    description_ta: 'ஆங்கிலத்தில் தேடுங்கள்',
    category: 'search',
  },

  // === OTHER ===
  {
    command: 'share',
    englishPhrases: ['share this', 'share verse', 'share the verse'],
    tamilPhrases: ['பகிர்', 'இதை பகிர்'],
    description_en: 'Share the current verse',
    description_ta: 'தற்போதைய வசனத்தை பகிரவும்',
    category: 'other',
  },
  {
    command: 'recordReflection',
    englishPhrases: ['record reflection', 'record thought', 'record my thought'],
    tamilPhrases: ['பதிவு செய்', 'சிந்தனை பதிவு'],
    description_en: 'Record a voice reflection on a verse',
    description_ta: 'ஒரு வசனத்தைப் பற்றிய குரல் சிந்தனையை பதிவு செய்யுங்கள்',
    category: 'other',
  },
  {
    command: 'startMemorization',
    englishPhrases: ['start memorization', 'memorize', 'memorize this'],
    tamilPhrases: ['மனப்பாடம்', 'மனப்பாடம் தொடங்கு'],
    description_en: 'Start memorization practice for a verse',
    description_ta: 'ஒரு வசனத்தை மனப்பாடம் செய்ய தொடங்குங்கள்',
    category: 'other',
  },
  {
    command: 'help',
    englishPhrases: ['help', 'what can you do'],
    tamilPhrases: ['உதவி', 'என்ன செய்ய முடியும்'],
    description_en: 'Show help and available commands',
    description_ta: 'உதவி மற்றும் கிடைக்கும் கட்டளைகளை காட்டவும்',
    category: 'other',
  },
];

// Build the command patterns from VOICE_COMMANDS for parsing
const COMMAND_PATTERNS: CommandPattern[] = VOICE_COMMANDS.flatMap((info) => {
  const allPhrases = [...info.englishPhrases, ...info.tamilPhrases];
  const hasArgs = allPhrases.some((p) => p.endsWith(' '));
  return [{
    prefixes: allPhrases,
    command: info.command,
    hasArgs,
  }];
});

// Sort so longer prefixes match first (avoids "search" matching before "search for")
COMMAND_PATTERNS.sort((a, b) => {
  const maxA = Math.max(...a.prefixes.map((p) => p.length));
  const maxB = Math.max(...b.prefixes.map((p) => p.length));
  return maxB - maxA;
});

export function parse(transcript: string): ParsedVoiceCommand | null {
  const normalized = transcript.trim().toLowerCase();

  if (!normalized) return null;

  for (const pattern of COMMAND_PATTERNS) {
    for (const prefix of pattern.prefixes) {
      const lowerPrefix = prefix.toLowerCase();
      if (normalized.startsWith(lowerPrefix)) {
        if (pattern.hasArgs) {
          const args = transcript.trim().slice(prefix.length).trim();
          return { command: pattern.command, args: args || undefined };
        }
        return { command: pattern.command };
      }
      // Also match exact equality for no-arg commands
      if (!pattern.hasArgs && normalized === lowerPrefix.trim()) {
        return { command: pattern.command };
      }
    }
  }

  return null;
}

export const voiceCommandParser = { parse };
