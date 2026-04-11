import type { ParsedVoiceCommand, VoiceCommand } from '@/types/speech';

interface CommandPattern {
  prefixes: string[];
  command: VoiceCommand;
  hasArgs: boolean;
}

/**
 * Deterministic prefix-matching voice command parser.
 * Supports English and Tamil commands.
 * Returns null if no command matches (caller treats it as a search query).
 */

const COMMAND_PATTERNS: CommandPattern[] = [
  // Ask the AI (with args) — primary catch-all for questions
  {
    prefixes: [
      'ask ',
      'tell me ',
      'what does the bible say about ',
      'what does the bible say ',
      'கேள் ',
    ],
    command: 'ask',
    hasArgs: true,
  },

  // Search commands (with args) — treated like "ask" since search now
  // lives inside the home assistant.
  {
    prefixes: ['search for ', 'search '],
    command: 'search',
    hasArgs: true,
  },

  // Switch the recognition language (no args)
  {
    prefixes: [
      'speak in english',
      'switch to english',
      'english please',
      'use english',
      'ஆங்கிலம்',
    ],
    command: 'speakEnglish',
    hasArgs: false,
  },
  {
    prefixes: [
      'speak in tamil',
      'switch to tamil',
      'tamil please',
      'use tamil',
      'தமிழில் பேசு',
      'தமிழ்',
    ],
    command: 'speakTamil',
    hasArgs: false,
  },

  // Navigation — go to a tab
  {
    prefixes: [
      'go home',
      'open home',
      'home screen',
      'home',
      'முகப்பு',
    ],
    command: 'openHome',
    hasArgs: false,
  },
  {
    prefixes: [
      'open search',
      'go to search',
      'show search',
      'தேடல்',
    ],
    // Search no longer has its own screen — route the user back home,
    // where the assistant lives.
    command: 'openHome',
    hasArgs: false,
  },
  {
    prefixes: [
      'open settings',
      'go to settings',
      'show settings',
      'settings',
      'அமைப்புகள்',
    ],
    command: 'openSettings',
    hasArgs: false,
  },
  {
    prefixes: ['search in tamil ', 'tamil search '],
    command: 'searchInTamil',
    hasArgs: false,
  },
  {
    prefixes: ['search in english ', 'english search '],
    command: 'searchInEnglish',
    hasArgs: false,
  },

  // Read commands
  {
    prefixes: [
      'read this',
      'read verse',
      'read the verse',
      'படி',
      'வசனம் படி',
    ],
    command: 'read',
    hasArgs: false,
  },
  {
    prefixes: ['read context', 'show context', 'சூழல் படி'],
    command: 'readContext',
    hasArgs: false,
  },

  // Bookmark/favorite commands
  {
    prefixes: [
      'bookmark this',
      'save this',
      'favorite this',
      'add to favorites',
      'புக்மார்க்',
      'சேமி',
    ],
    command: 'bookmark',
    hasArgs: false,
  },

  // Share commands
  {
    prefixes: ['share this', 'share verse', 'share the verse', 'பகிர்'],
    command: 'share',
    hasArgs: false,
  },

  // Speed commands
  {
    prefixes: ['slow down', 'slower', 'மெதுவாக'],
    command: 'slowDown',
    hasArgs: false,
  },
  {
    prefixes: ['speed up', 'faster', 'வேகமாக'],
    command: 'speedUp',
    hasArgs: false,
  },

  // Repeat/replay
  {
    prefixes: ['repeat', 'again', 'replay', 'மீண்டும்'],
    command: 'repeat',
    hasArgs: false,
  },

  // Stop/pause
  {
    prefixes: ['stop', 'pause', 'quiet', 'நிறுத்து'],
    command: 'stop',
    hasArgs: false,
  },

  // Reflection
  {
    prefixes: [
      'record reflection',
      'record thought',
      'record my thought',
      'பதிவு செய்',
    ],
    command: 'recordReflection',
    hasArgs: false,
  },

  // Memorization
  {
    prefixes: [
      'start memorization',
      'memorize',
      'memorize this',
      'மனப்பாடம்',
    ],
    command: 'startMemorization',
    hasArgs: false,
  },

  // Navigation
  {
    prefixes: [
      'open favorites',
      'my favorites',
      'bookmarks',
      'show favorites',
      'பிடித்தவை',
    ],
    command: 'openFavorites',
    hasArgs: false,
  },
  {
    prefixes: [
      'daily verse',
      'verse of the day',
      "today's verse",
      'இன்றைய வசனம்',
    ],
    command: 'dailyVerse',
    hasArgs: false,
  },

  // Tamil search commands
  {
    prefixes: ['தமிழில் தேடு '],
    command: 'searchInTamil',
    hasArgs: false,
  },
  {
    prefixes: ['ஆங்கிலத்தில் தேடு '],
    command: 'searchInEnglish',
    hasArgs: false,
  },

  // Tamil search with args
  {
    prefixes: ['தேடு '],
    command: 'search',
    hasArgs: true,
  },
];

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
        // For commands without args, the transcript must match the prefix
        // (possibly with trailing whitespace or minor words)
        return { command: pattern.command };
      }
    }
  }

  return null;
}

export const voiceCommandParser = { parse };
