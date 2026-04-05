# Heavenly Push — Implementation Plan



## Context



Building a voice-first bilingual (English/Tamil) Bible search & listening app from a completely empty repo. The app targets visually impaired, elderly, and low-digital-literacy users across iOS, Android, and Web. The PRD at `.claude/plans/prd-doc.md` is the single source of truth. This plan translates it into actionable phases with exact files, dependencies, and acceptance criteria.



---



## Tech Stack



| Layer | Choice |

|---|---|

| Framework | Expo (React Native) with web support |

| Language | TypeScript `strict: true` |

| State | Zustand (persist middleware for settings) |

| i18n | i18next + react-i18next + expo-localization |

| Database | expo-sqlite with FTS5 |

| Preferences | @react-native-async-storage/async-storage |

| Voice Input | SpeechRecognitionAdapter interface + @react-native-voice/voice (native) / Web Speech API (web) |

| TTS | expo-speech |

| Audio Recording | expo-av + expo-file-system |

| Sensors | expo-sensors (shake), expo-haptics |

| Notifications | expo-notifications |

| Navigation | React Navigation (bottom tabs + native stack) |

| Styling | NativeWind (Tailwind for RN) |



---



## Project Structure



```

heavenly-push/

├── app.json

├── App.tsx

├── babel.config.js

├── metro.config.js

├── tailwind.config.js

├── nativewind-env.d.ts

├── tsconfig.json

├── package.json

├── assets/

├── src/

│   ├── app/

│   │   ├── navigation/

│   │   │   ├── RootNavigator.tsx

│   │   │   ├── TabNavigator.tsx

│   │   │   └── linking.ts

│   │   └── screens/

│   │       ├── HomeScreen.tsx

│   │       ├── SearchScreen.tsx

│   │       ├── VerseDetailScreen.tsx

│   │       ├── FavoritesScreen.tsx

│   │       ├── PlansScreen.tsx

│   │       ├── PlanDetailScreen.tsx

│   │       └── SettingsScreen.tsx

│   ├── components/

│   │   ├── common/

│   │   │   ├── PrimaryButton.tsx

│   │   │   ├── IconButtonAccessible.tsx

│   │   │   ├── SectionHeader.tsx

│   │   │   ├── EmptyState.tsx

│   │   │   ├── PermissionPromptCard.tsx

│   │   │   └── LoadingSpinner.tsx

│   │   ├── search/

│   │   │   ├── VoiceSearchButton.tsx

│   │   │   ├── SearchBar.tsx

│   │   │   ├── ResultList.tsx

│   │   │   └── SearchFilterPills.tsx

│   │   ├── verse/

│   │   │   ├── VerseCard.tsx

│   │   │   ├── FavoriteButton.tsx

│   │   │   ├── ContextNavigator.tsx

│   │   │   ├── CrossReferences.tsx

│   │   │   ├── ChapterSummary.tsx

│   │   │   └── HistoricalContext.tsx

│   │   ├── audio/

│   │   │   ├── PlaybackControls.tsx

│   │   │   ├── TtsSpeedControl.tsx

│   │   │   ├── ReflectionRecorder.tsx

│   │   │   ├── MemorizationPlayer.tsx

│   │   │   └── FillInBlanksPlayer.tsx

│   │   └── settings/

│   │       └── HighContrastToggle.tsx

│   ├── services/

│   │   ├── audio/

│   │   │   ├── TTSService.ts

│   │   │   └── AudioRecordingService.ts

│   │   ├── speech/

│   │   │   ├── SpeechRecognitionAdapter.ts

│   │   │   ├── NativeSpeechProvider.ts

│   │   │   ├── WebSpeechProvider.ts

│   │   │   ├── SpeechService.ts

│   │   │   └── VoiceCommandParser.ts

│   │   ├── notifications/

│   │   │   └── NotificationService.ts

│   │   ├── storage/

│   │   │   └── FileStorageService.ts

│   │   └── search/

│   │       ├── SearchEngine.ts

│   │       ├── QueryNormalizer.ts

│   │       ├── ReferenceParser.ts

│   │       └── MoodMapper.ts

│   ├── stores/

│   │   ├── useSettingsStore.ts

│   │   ├── useVoiceStore.ts

│   │   ├── usePlaybackStore.ts

│   │   ├── useFavoritesStore.ts

│   │   └── useSearchStore.ts

│   ├── hooks/

│   │   ├── useVoiceController.ts

│   │   ├── useShakeDetector.ts

│   │   ├── useTTS.ts

│   │   ├── useVerseContext.ts

│   │   ├── useDailyVerse.ts

│   │   ├── useAccessibility.ts

│   │   ├── useMemorization.ts

│   │   ├── useFillInBlanks.ts

│   │   └── usePlanProgress.ts

│   ├── data/

│   │   ├── seed/

│   │   │   ├── verses-en.json

│   │   │   ├── verses-ta.json

│   │   │   ├── cross-references.json

│   │   │   ├── summaries.json

│   │   │   └── historical-context.json

│   │   ├── plans/

│   │   │   └── default-plans.json

│   │   └── dictionaries/

│   │       ├── mood-themes.ts

│   │       ├── book-codes.ts

│   │       └── theme-tags.ts

│   ├── db/

│   │   ├── database.ts

│   │   ├── migrations/

│   │   │   ├── index.ts

│   │   │   └── 001_initial.ts

│   │   └── repositories/

│   │       ├── VerseRepository.ts

│   │       ├── FavoritesRepository.ts

│   │       ├── SearchHistoryRepository.ts

│   │       ├── SettingsRepository.ts

│   │       ├── ReflectionRepository.ts

│   │       ├── DailyVerseRepository.ts

│   │       └── PlanRepository.ts

│   ├── utils/

│   │   ├── id.ts

│   │   ├── date.ts

│   │   ├── debounce.ts

│   │   ├── textSimilarity.ts

│   │   └── platform.ts

│   ├── types/

│   │   ├── models.ts

│   │   ├── navigation.ts

│   │   └── speech.ts

│   ├── constants/

│   │   ├── theme.ts

│   │   ├── accessibility.ts

│   │   └── config.ts

│   └── i18n/

│       ├── index.ts

│       ├── en.json

│       └── ta.json

```



---



## Phase 1 — App Foundation



**Goal:** Expo scaffold launches on iOS, Android, Web with navigation, theme, i18n, stores, and accessible UI primitives.



**Dependencies:** None (greenfield).



**Steps:**

1. `npx create-expo-app@latest . --template blank-typescript`

2. Install deps: `nativewind`, `tailwindcss`, `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`, `zustand`, `i18next`, `react-i18next`, `expo-localization`, `@react-native-async-storage/async-storage`, `expo-haptics`

3. Configure `tsconfig.json` with `strict: true` and `@/*` path alias

4. Set up NativeWind (`babel.config.js`, `metro.config.js`, `tailwind.config.js`)



**Files to create:**



| File | Purpose |

|---|---|

| `App.tsx` | Entry: SafeAreaProvider, NavigationContainer, i18n init |

| `src/types/models.ts` | All TS interfaces from PRD §13 |

| `src/types/navigation.ts` | RootStackParamList, TabParamList |

| `src/types/speech.ts` | SpeechRecognitionAdapter interface, TTS types |

| `src/constants/theme.ts` | Dark & light high-contrast palettes, spacing, font sizes |

| `src/constants/accessibility.ts` | MIN_TOUCH_SIZE=44, role constants |

| `src/constants/config.ts` | DEFAULT_TTS_SPEED, MAX_SEARCH_RESULTS, SHAKE_COOLDOWN_MS |

| `src/i18n/index.ts` | i18next init with expo-localization, fallback 'en' |

| `src/i18n/en.json` | English UI strings |

| `src/i18n/ta.json` | Tamil UI strings |

| `src/stores/useSettingsStore.ts` | Language, ttsSpeed, highContrast, haptics, dailyPush. Persisted via zustand `persist` + AsyncStorage |

| `src/stores/useVoiceStore.ts` | isListening, transcript, error, voiceMode (ephemeral) |

| `src/stores/usePlaybackStore.ts` | currentVerse, speakingStatus, speed, queue (ephemeral) |

| `src/stores/useFavoritesStore.ts` | favoriteIds, loading, add/remove |

| `src/stores/useSearchStore.ts` | query, results, recentHistory, loading, error |

| `src/app/navigation/TabNavigator.tsx` | Bottom tabs: Home, Search, Favorites, Settings. Large icons, accessibility labels |

| `src/app/navigation/RootNavigator.tsx` | Root stack wrapping TabNavigator + VerseDetail modal |

| `src/app/navigation/linking.ts` | Deep link config stub |

| `src/app/screens/*.tsx` | All 6 screens as accessible placeholders |

| `src/components/common/*.tsx` | PrimaryButton, IconButtonAccessible, SectionHeader, EmptyState, PermissionPromptCard, LoadingSpinner |

| `src/components/settings/HighContrastToggle.tsx` | Theme toggle |

| `src/hooks/useAccessibility.ts` | Current font scale, reduced motion, theme colors |

| `src/utils/id.ts` | UUID generation |

| `src/utils/platform.ts` | isWeb(), isIOS(), isAndroid() |

| `src/utils/debounce.ts` | Generic debounce |



**Key details:**

- Theme: `darkHighContrast` (black bg, white/yellow text) and `lightHighContrast` (white bg, black text). Toggled via `useSettingsStore.highContrastMode`. NativeWind `darkMode: 'class'`.

- Zustand persist: Only `useSettingsStore` persists (AsyncStorage). Other stores are ephemeral.

- All placeholder screens: SafeAreaView + accessible header title.

- Tab bar: increased height, `tabBarAccessibilityLabel` on each screen, `@expo/vector-icons`.



**Acceptance criteria:**

- [ ] `npx expo start` launches on iOS, Android, Web without errors

- [ ] Tab navigation works between all screens

- [ ] Theme toggle changes appearance immediately

- [ ] Language toggle switches UI strings

- [ ] Settings persist after app restart

- [ ] VoiceOver/TalkBack can navigate all tabs and read labels



---



## Phase 2 — Local Data Layer



**Goal:** SQLite with FTS, seed verses, working search, history & favorites persistence.



**Dependencies:** Phase 1 (types, stores, utils).



**Steps:**

5. Install: `expo-sqlite`

6. Create DB init, migrations, FTS5 virtual table

7. Create repository classes

8. Seed 50–100 bilingual verses with theme tags and keywords

9. Build search engine pipeline

10. Connect stores to DB repos



**Files to create:**



| File | Purpose |

|---|---|

| `src/db/database.ts` | Opens SQLite DB, runs migrations, exports `getDatabase()` singleton |

| `src/db/migrations/index.ts` | Migration runner using `PRAGMA user_version` |

| `src/db/migrations/001_initial.ts` | Creates 7 tables + FTS5 virtual table `verses_fts` on text_en, text_ta, keywords_en, keywords_ta, theme_tags + indexes on (book_code, chapter, verse) |

| `src/db/repositories/*.ts` | Verse, Favorites, SearchHistory, Settings, Reflection, DailyVerse, Plan repos with typed SQL queries |

| `src/data/seed/verses-en.json` | 50–100 KJV verses (love, hope, faith, comfort, peace, courage, forgiveness, praise, healing, trust) |

| `src/data/seed/verses-ta.json` | Matching Tamil translations |

| `src/data/dictionaries/mood-themes.ts` | `moodToThemes` map from PRD §15.2 |

| `src/data/dictionaries/book-codes.ts` | 66-book code-to-name map + aliases |

| `src/data/dictionaries/theme-tags.ts` | Master theme tag list |

| `src/services/search/QueryNormalizer.ts` | trim, lowercase, strip punctuation, collapse whitespace |

| `src/services/search/ReferenceParser.ts` | Detects "John 3:16" etc., returns `{ bookCode, chapter, verse? }` |

| `src/services/search/MoodMapper.ts` | Maps mood keywords to theme tags |

| `src/services/search/SearchEngine.ts` | Full pipeline: normalize → detect type → execute → rank → cap |

| `src/utils/textSimilarity.ts` | Levenshtein distance + normalized score |



**Key details:**

- FTS5: `CREATE VIRTUAL TABLE verses_fts USING fts5(text_en, text_ta, keywords_en, keywords_ta, theme_tags, content=verses, content_rowid=rowid)` with sync triggers.

- Seed: On first launch after migration, bulk-insert from JSON. Merge en + ta by verse ID.

- Search ranking: reference=100, exact text=80, FTS=60, theme=40, fuzzy=20. Return top 20 for UI, top 3 for voice.

- Repos: Plain classes, raw SQL, typed returns. No ORM.



**Acceptance criteria:**

- [ ] DB initializes without error on launch

- [ ] `searchFTS("love")` returns English matches

- [ ] `searchFTS("அன்பு")` returns Tamil matches

- [ ] `ReferenceParser.parse("John 3:16")` → `{ bookCode: "JHN", chapter: 3, verse: 16 }`

- [ ] `SearchEngine.search("I am feeling sad")` returns comfort/hope/peace verses

- [ ] Favorites persist across restart

- [ ] Search history persists across restart

- [ ] `getContext(verseId, 2)` returns surrounding verses



---



## Phase 3 — Voice and Audio Layer



**Goal:** Speech recognition, TTS, haptics, voice commands, shake-to-speak.



**Dependencies:** Phase 1 (stores, types), Phase 2 (search engine, verse repo).



**Steps:**

11. Install: `@react-native-voice/voice`, `expo-speech`, `expo-sensors`

12. Implement SpeechRecognitionAdapter with native + web providers

13. Build TTSService wrapping expo-speech

14. Build voice command parser (deterministic, no LLM)

15. Build shake detection hook

16. Build VoiceController hook orchestrating STT/TTS/commands



**Files to create:**



| File | Purpose |

|---|---|

| `src/services/speech/SpeechRecognitionAdapter.ts` | Interface per PRD §16.1 |

| `src/services/speech/NativeSpeechProvider.ts` | @react-native-voice/voice impl |

| `src/services/speech/WebSpeechProvider.ts` | Web Speech API impl, graceful fallback |

| `src/services/speech/SpeechService.ts` | Factory returning platform-appropriate provider |

| `src/services/speech/VoiceCommandParser.ts` | Prefix matching: "search for X", "read this", "bookmark this", "slow down", "stop", etc. |

| `src/services/audio/TTSService.ts` | speak/stop/pause/resume, single-session rule, respects speed setting |

| `src/hooks/useVoiceController.ts` | Central: starts/stops listening, routes to commands or search, stops TTS before mic |

| `src/hooks/useShakeDetector.ts` | Accelerometer shake detect, debounce with cooldown, haptic confirm, no-op on web |

| `src/hooks/useTTS.ts` | speakVerse(verse, lang?), stop(), isSpeaking |



**Key details:**

- TTS/STT mutex: Always stop TTS before starting mic, and vice versa.

- Haptics: Medium impact on mic start, success notification on shake. Gated on `hapticsEnabled`.

- Voice commands: deterministic prefix matching, English + Tamil phrases. Unmatched text = search query.

- Shake: Accelerometer 100ms interval, magnitude threshold ~1.5g, 2s cooldown.

- Web: `WebSpeechProvider.isAvailable()` returns false if API missing. Voice button hidden on web when unavailable.



**Acceptance criteria:**

- [ ] Voice button starts speech recognition (permission requested first time)

- [ ] Speaking "love" triggers search, results appear

- [ ] "read this" on verse detail triggers TTS

- [ ] TTS stops immediately when mic starts

- [ ] "Slow down" / "Speed up" adjust TTS speed

- [ ] Shake triggers listening + haptic on mobile, debounced

- [ ] Denied mic → PermissionPromptCard, text search still works

- [ ] Web without Speech API → voice button hidden, no crash



---



## Phase 4 — Main User Flows



**Goal:** All primary screens fully functional with accessible, voice-first UX.



**Dependencies:** Phases 1–3.



**Steps:**

17. Build HomeScreen (daily verse, voice search, recent activity)

18. Build SearchScreen (text/voice input, filters, results)

19. Build VerseDetailScreen (TTS, context, bookmark, share)

20. Build FavoritesScreen (list, replay, remove)

21. Build SettingsScreen (all preference controls)

22. Build all remaining UI components



**Files to create/implement:**



| File | Purpose |

|---|---|

| `src/app/screens/HomeScreen.tsx` | Daily verse card, large VoiceSearchButton, recent searches, playback mini-bar |

| `src/app/screens/SearchScreen.tsx` | SearchBar + voice, filter pills, ResultList. Auto-populate from voice. 0 results → spoken fallback |

| `src/app/screens/VerseDetailScreen.tsx` | Both languages (fallback logic), PlaybackControls, FavoriteButton, "Read Context", share, stubs for reflection/memorization |

| `src/app/screens/FavoritesScreen.tsx` | FlatList of VerseCards, remove, empty state, replay |

| `src/app/screens/SettingsScreen.tsx` | Language picker, TTS speed slider, contrast toggle, haptics, shake, daily push, auto-play |

| `src/components/search/VoiceSearchButton.tsx` | 64x64 min, pulse animation while listening |

| `src/components/search/SearchBar.tsx` | TextInput + clear + voice, debounced |

| `src/components/search/ResultList.tsx` | FlatList of VerseCards, announces result count |

| `src/components/search/SearchFilterPills.tsx` | Language + theme filter chips |

| `src/components/verse/VerseCard.tsx` | Reference, text snippet, theme pills, 44px+ target |

| `src/components/verse/FavoriteButton.tsx` | Heart toggle, haptic, optimistic UI |

| `src/components/verse/ContextNavigator.tsx` | Previous/Next/Full Chapter buttons |

| `src/components/audio/PlaybackControls.tsx` | Play/Pause/Stop/Speed/Repeat, large buttons |

| `src/components/audio/TtsSpeedControl.tsx` | Slider 0.5–2.0 |

| `src/hooks/useVerseContext.ts` | Loads surrounding verses |

| `src/hooks/useDailyVerse.ts` | Resolves today's verse, avoids repeats |



**Key details:**

- Screen reader: `AccessibilityInfo.announceForAccessibility("X results found")` after search.

- Language fallback: If `textTa` null for Tamil user, show English + announce fallback.

- Share: `expo-sharing` / RN `Share` API, plain text.

- Voice flow: `useVoiceStore.transcript` changes → auto-populate SearchBar → trigger search.



**Acceptance criteria:**

- [ ] Home shows daily verse, tappable to detail

- [ ] Voice "love" → search results appear

- [ ] "John 3:16" text search → exact verse

- [ ] Verse detail shows both languages, plays TTS

- [ ] "Read Context" shows surrounding verses

- [ ] Favorite heart → verse in Favorites tab

- [ ] All settings take effect immediately

- [ ] All screens work with VoiceOver/TalkBack, 44x44 touch targets

- [ ] Entire flow works offline



---



## Phase 5 — Daily Whisper



**Goal:** Local notifications deliver daily verse; tap opens verse detail.



**Dependencies:** Phases 1–2, Phase 4 (VerseDetailScreen).



**Steps:**

23. Install: `expo-notifications`

24. Build NotificationService

25. Build daily verse resolver (avoids last 30 shown)

26. Wire notification tap → VerseDetailScreen

27. Handle permission denial gracefully



**Files to create:**



| File | Purpose |

|---|---|

| `src/services/notifications/NotificationService.ts` | requestPermissions, scheduleDailyVerse(time, verseId, text), cancelDailyVerse, handleNotificationResponse |



**Updates:** `src/hooks/useDailyVerse.ts` (exclude recent 30), `src/app/navigation/linking.ts` (notification response handler), `App.tsx` (register notification listener).



**Key details:**

- Schedule: `expo-notifications` repeating daily trigger `{ hour, minute, repeats: true }`.

- Verse selection: exclude `DailyVerseRepository.getRecent(30)`, pick random from remainder.

- Deep link: Extract `verseId` from notification data, navigate to VerseDetail.

- Auto-play: If `autoPlayVerseOnOpen` true + opened via notification, auto-TTS after 500ms.

- Permission denied: show `PermissionPromptCard` in Settings.



**Acceptance criteria:**

- [ ] Enabling daily push requests notification permission

- [ ] Notification fires at configured time

- [ ] Tapping notification opens correct verse detail

- [ ] No repeat within 30-verse window

- [ ] Disabling cancels notification

- [ ] Permission denied → helpful guidance shown

- [ ] No crash on web (notifications unavailable)



---



## Phase 6 — Reflection + Memorization



**Goal:** Voice reflections on verses + chunked memorization practice.



**Dependencies:** Phases 1–4.



**Steps:**

28. Install: `expo-av`, `expo-file-system`

29. Build AudioRecordingService + FileStorageService

30. Build ReflectionRecorder component

31. Build memorization hook + MemorizationPlayer

32. Wire into VerseDetailScreen



**Files to create:**



| File | Purpose |

|---|---|

| `src/services/audio/AudioRecordingService.ts` | Start/stop recording, play/delete. expo-av, M4A/AAC, 120s limit |

| `src/services/storage/FileStorageService.ts` | Save to `reflections/{verseId}/{noteId}.m4a`, delete |

| `src/components/audio/ReflectionRecorder.tsx` | Record/stop/preview/save/discard + list existing reflections |

| `src/hooks/useMemorization.ts` | Chunk verse, manage listen/repeat/verify state, compare via textSimilarity (≥0.7 = pass) |

| `src/components/audio/MemorizationPlayer.tsx` | Highlighted chunk, Listen/My Turn buttons, feedback, progress |



**Key details:**

- Chunking: split on sentence punctuation first, then commas if >8 words, minimum 3 words.

- Memorization flow: show chunk → TTS speaks → user repeats → compare → feedback → next.

- Mic denied fallback: self-assessment "Did you get it right?" Yes/No buttons.

- ReflectionRecorder state: IDLE → RECORDING → PREVIEW → SAVED.



**Acceptance criteria:**

- [ ] Record, preview, save, playback, delete reflections

- [ ] Reflections persist across restart

- [ ] Memorization: hear chunk, speak it, get pass/fail feedback

- [ ] All chunks complete → success state

- [ ] Mic denied → manual self-check fallback



---



## Phase 7 — Extensions



**Goal:** Plans, cross-references, summaries, historical context, fill-in-blanks. **Build only after MVP (Phases 1–6) is stable.**



**Dependencies:** All prior phases.



**Files to create:**



| File | Purpose |

|---|---|

| `src/data/plans/default-plans.json` | 3–5 curated plans (e.g., "7 Days of Peace") |

| `src/data/seed/cross-references.json` | verseId → related verseIds map |

| `src/data/seed/summaries.json` | chapter → summary map |

| `src/data/seed/historical-context.json` | verse/book → context map |

| `src/app/screens/PlansScreen.tsx` | Plan list with progress |

| `src/app/screens/PlanDetailScreen.tsx` | Day-by-day flow, sequential TTS playback |

| `src/components/verse/CrossReferences.tsx` | Related verses on VerseDetail |

| `src/components/verse/ChapterSummary.tsx` | Chapter summary above context |

| `src/components/verse/HistoricalContext.tsx` | Expandable background section |

| `src/components/audio/FillInBlanksPlayer.tsx` | Verse with blanks, type/speak answers, scoring |

| `src/hooks/useFillInBlanks.ts` | Generate blanks (30–40% content words), validate answers |

| `src/hooks/usePlanProgress.ts` | Plan state, day tracking, progress calculation |



**Acceptance criteria:**

- [ ] Plans tab shows plans with progress

- [ ] Plan day plays verses sequentially via TTS

- [ ] Cross-references, summaries, context appear on verse detail

- [ ] Fill-in-blanks presents verse with blanks, validates answers

- [ ] All new screens accessible with VoiceOver/TalkBack



---



## Agent Team Structure (for multi-agent build)



| Agent | Owns | Phases |

|---|---|---|

| **A — Foundation & Data** | `App.tsx`, config, `src/types/`, `src/constants/`, `src/i18n/`, `src/stores/`, `src/utils/`, `src/db/`, `src/data/`, `src/services/search/` | 1–2 |

| **B — Voice & Audio** | `src/services/speech/`, `src/services/audio/`, `src/services/storage/`, voice/TTS/shake hooks | 3 |

| **C — Screens & UI** | `src/app/screens/`, `src/app/navigation/`, `src/components/`, remaining hooks, `src/services/notifications/` | 4–7 |



**Shared contracts:**

- `SearchEngine.search(query, options)` → `Promise<SearchResult[]>`

- `VerseRepository.getById/getContext/searchFTS`

- `TTSService.speak(text, lang, speed)` → `Promise<void>`

- `SpeechService.startListening(lang)` → `Promise<void>`

- All Zustand store shapes match `src/types/models.ts`



---



## Verification



After each phase, verify by:

1. `npx expo start` — app launches without errors on all 3 platforms

2. Run unit tests: `npx jest` (search utils, reference parser, mood mapper, store actions)

3. Manual QA per phase acceptance criteria above

4. VoiceOver (iOS) / TalkBack (Android) walkthrough of new screens

5. Kill + reopen app to verify persistence



**Dev build note:** `@react-native-voice/voice` requires a development build (`npx expo prebuild` + native run). Expo Go will not support all voice features.



---



## Critical Files



- `.claude/plans/prd-doc.md` — source of truth

- `src/types/models.ts` — all interfaces, must be created first

- `src/db/migrations/001_initial.ts` — SQLite schema + FTS5

- `src/services/speech/SpeechRecognitionAdapter.ts` — voice architecture interface

- `src/services/search/SearchEngine.ts` — central search pipeline

