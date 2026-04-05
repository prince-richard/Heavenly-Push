# Product Requirements Document (PRD) & Technical Specification
## Project Name: Heavenly Push
## Product Type: Voice-First Bilingual Bible Search & Listening App
## Target Platforms: iOS, Android, Web
## Primary Tech Direction: Expo + React Native + TypeScript

---

# 1. Master Build Instruction for Claude

Use this document as the single source of truth for architecture, implementation order, data models, and acceptance criteria.

## Hard Rules
1. Build this as a **modular, production-oriented TypeScript app** with strict typing enabled.
2. Prioritize **accessibility, voice-first interaction, and offline-first behavior** over visual polish.
3. Do **not** over-engineer backend services in the first implementation.
4. Do **not** implement speculative features without explicit scope approval.
5. Build the app in **phases**, and ensure each phase is runnable before moving to the next.
6. Where native capabilities differ across iOS, Android, and Web, implement a clean abstraction layer instead of platform-specific logic spread across the app.
7. If a feature depends on licensing, external APIs, or real-time backend infrastructure, stub it cleanly and mark it as deferred rather than pretending it is complete.
8. All components must include accessibility props and support screen readers.
9. All core interactions must be operable with minimal or no visual interaction.
10. Code must be cleanly separated into:
   - app/screens
   - components
   - services
   - stores
   - data
   - hooks
   - utils
   - types

---

# 2. Product Vision

Heavenly Push is a **voice-first bilingual Christian app** designed to help users search, hear, save, and learn Bible verses in **English and Tamil**, with special emphasis on:
- visually impaired users
- elderly users
- low-digital-literacy users
- bilingual Tamil/English speakers
- users seeking comfort, prayer, memorization, and daily spiritual guidance

The app must feel like:
- a **simple spiritual companion**
- a **voice-operated verse guide**
- an **accessible daily devotional tool**

This is **not** a generic social media app, not a theological research platform, and not a full church community system in version 1.

---

# 3. Scope Strategy

## 3.1 MVP Scope (Must Build First)
These are the only features Claude should treat as mandatory for initial delivery:

### Core MVP Features
1. Bilingual verse search (English + Tamil)
2. Voice-triggered search
3. Text-to-speech playback of verses
4. Offline local verse database
5. Favorites / bookmarks
6. Daily verse notification
7. High-contrast accessible UI
8. Adjustable speech speed
9. Shake-to-speak trigger on mobile
10. “Read context” for surrounding verses
11. Basic mood/theme search
12. Simple audio memorization mode
13. Personal voice reflections attached to a verse

## 3.2 Phase 2 Features (Build After MVP Is Stable)
1. Cross-reference suggestions
2. Guided listening plans / curriculums
3. Audio fill-in-the-blanks
4. Historical background summaries
5. Simplified chapter summaries
6. Transliteration-aware Tamil fuzzy search improvements
7. Playlist grouping for saved verses

## 3.3 Deferred / Out of Scope for Initial Build
These are **not** to be fully implemented in the first version:
1. Community feed
2. Audio testimony sharing
3. Shared listening rooms
4. Live voice chat between users
5. Full cloud sync
6. Full user accounts/authentication
7. Real-time collaborative features
8. Large-scale LLM orchestration
9. Paid subscription flows
10. Admin CMS

If needed, create placeholder interfaces and TODO markers only.

---

# 4. Critical Product Constraints

## 4.1 Accessibility-First Constraint
This app must remain usable even if the user:
- cannot read small text
- cannot navigate complex menus
- cannot reliably tap small buttons
- prefers only voice interaction
- uses a screen reader full time

## 4.2 Offline-First Constraint
Core functionality must work without internet:
- verse search from local database
- verse playback via device TTS
- favorites
- local plans
- local reflections
- settings
- recent history

Internet must only be required for explicitly online-only features.

## 4.3 Legal / Content Constraint
Do not assume all Bible translations are freely embeddable.

### Translation rule
- Use **public-domain or properly licensed translations** for bundled content.
- For development and MVP seeding, default to:
  - **KJV** or another clearly usable English public-domain text
  - a **public-domain or explicitly licensed Tamil translation**
- Do **not** bundle NIV by default unless licensing is already secured.

---

# 5. Target Users

## Primary Users
1. Visually impaired Christians
2. Elderly Tamil/English bilingual users
3. Users who prefer listening rather than reading
4. Users seeking quick spiritual encouragement
5. Users who want voice-driven scripture access

## Secondary Users
1. Anyone wanting Bible verse search
2. Users practicing memorization
3. Users looking for prayer/thematic verses
4. Families using the app for devotion time

---

# 6. User Problems to Solve

1. “I want a verse fast without typing.”
2. “I cannot see the screen clearly.”
3. “I want the verse spoken to me in my language.”
4. “I want to search using how I feel, not exact references.”
5. “I want to save verses and revisit them later.”
6. “I want the app to work even without internet.”
7. “I want an easier way to memorize scripture.”
8. “I want something simple, not full of clutter.”

---

# 7. Success Criteria

The app is successful if a first-time user can:
1. Open the app and start a search within 5 seconds
2. Trigger voice search without hunting for controls
3. Search by keyword, verse reference, or emotion/theme
4. Hear the verse read aloud in the correct language
5. Save the verse to favorites
6. Ask for surrounding context
7. Receive and open a daily verse notification
8. Use the app with screen reader support enabled
9. Use the app offline for all core reading/listening features

---

# 8. Technical Stack

## 8.1 Core Framework
- Expo (React Native) with web support
- TypeScript with `strict: true`

## 8.2 State Management
- Zustand

## 8.3 Internationalization
- `i18next`
- `react-i18next`
- `expo-localization`

## 8.4 Storage
- `expo-sqlite` for structured local data
- `@react-native-async-storage/async-storage` for preferences and lightweight state

## 8.5 Voice / Audio
- Speech recognition must be abstracted behind a provider interface
- TTS via `expo-speech`
- Audio recording for reflections via Expo audio APIs
- Haptics via `expo-haptics`

## 8.6 Device / Sensors
- `expo-sensors` for shake detection
- `expo-notifications` for scheduled local notifications

## 8.7 Navigation
- React Navigation
- Keep routing simple and accessible
- Support deep linking later, but do not make the initial build depend on unstable navigation assumptions

## 8.8 UI
- React Native
- NativeWind for styling
- High-contrast theme system
- Large touch targets
- No tiny icon-only critical actions

---

# 9. Build Assumptions

## 9.1 Development Build Assumption
This app should be structured so it works in a proper Expo/native development build workflow where needed. Do not assume every native speech feature will work in plain Expo Go.

## 9.2 Web Assumption
Web support is required, but mobile accessibility is the top priority.  
If any feature is unsupported on web:
- degrade gracefully
- show accessible fallback UI
- do not break the app shell

## 9.3 Data Assumption
The first implementation can ship with:
- mock bilingual verse data
- seeded local DB
- static theme tags
- local curated plans

No backend is required for MVP.

---

# 10. Information Architecture

## 10.1 Screens
### 1. Home Screen
Purpose:
- primary landing page
- quick voice search entry
- daily verse
- recent activity
- current listening controls

### 2. Search Screen
Purpose:
- text search
- voice search
- quick filters
- results list
- recent searches

### 3. Verse Detail Screen
Purpose:
- show verse content
- play TTS
- read context
- bookmark
- share
- record reflection
- start memorization

### 4. Favorites Screen
Purpose:
- saved verses
- grouped lists / future playlists
- replay saved verse audio/TTS

### 5. Plans Screen
Purpose:
- curated listening plans
- daily progress
- continue current plan

### 6. Settings Screen
Purpose:
- language
- TTS speed
- contrast mode
- haptics toggle
- shake-to-speak toggle
- storage cleanup
- permissions guidance

---

# 11. Core Functional Requirements

## 11.1 Search
The app must support:
1. Exact search by word or phrase
2. Search by Bible reference
3. Search by theme/emotion
4. Tamil and English input
5. Fuzzy search
6. Transliteration-aware Tamil matching where possible
7. Offline search using local SQLite indexes

### Supported search examples
- “John 3:16”
- “Love”
- “Fear not”
- “மன்னிப்பு”
- “anbu”
- “I am feeling sad”
- “verses about healing”

### Search result rules
- If 0 results: return accessible spoken fallback + suggestions
- If 1–10 results: show and speak concise result set
- If >10 results: show top results first
- If >100 results: summarize and ask user to refine

## 11.2 Voice Commands
MVP voice commands should support:
- “Search for love”
- “Read this”
- “Read context”
- “Bookmark this”
- “Share this”
- “Slow down”
- “Speed up”
- “Repeat”
- “Stop”
- “Record reflection”
- “Start memorization”
- “Open favorites”
- “Daily verse”
- “Search in Tamil”
- “Search in English”

Voice command handling must be deterministic where possible, not blindly LLM-dependent.

## 11.3 TTS Playback
Requirements:
1. Read verse text aloud
2. Choose language-appropriate voice if supported
3. Stop playback immediately when microphone starts listening
4. Stop or duck playback when app audio focus changes
5. Support playback speed controls
6. Support replay
7. Support chapter/context playback

## 11.4 Verse Context
From verse detail, user must be able to:
- hear previous and next verses
- hear full chapter
- navigate verse-by-verse

## 11.5 Favorites
Users must be able to:
- save verse
- remove verse
- list favorites
- filter favorites by language or theme later
- replay favorites

## 11.6 Daily Whisper
Users must be able to:
- configure time for daily verse
- receive local notification
- open directly into verse detail
- optionally auto-play TTS on open if permission/state allows

## 11.7 Voice Reflection
Users must be able to:
- record an audio reflection linked to a verse
- replay reflection
- delete reflection
- store reflection locally

## 11.8 Memorization Mode
MVP version:
- split verse into chunks
- read one chunk
- pause
- allow user to repeat
- optionally compare recognized text against expected chunk
- provide simple success/error feedback

Do not overbuild pronunciation scoring. Use a practical text similarity threshold.

---

# 12. Non-Functional Requirements

## 12.1 Accessibility
Every interactive component must include:
- `accessibilityRole`
- `accessibilityLabel`
- `accessibilityHint` where useful

UI rules:
- minimum 44x44 touch target
- scalable typography
- no essential information conveyed by color only
- high contrast support
- keyboard focus support on web
- readable layouts at large text sizes

## 12.2 Performance
- app startup should feel fast
- local search should complete quickly on seeded dataset
- TTS should start with minimal delay
- avoid expensive re-renders
- use memoization where useful
- create indexed SQLite lookups

## 12.3 Reliability
- no crashing when microphone permissions are denied
- no crashing when notifications are denied
- no app freeze if TTS fails
- no broken flow if a verse lacks Tamil or English counterpart

## 12.4 Maintainability
- feature-based folder structure
- typed services
- minimal logic inside screens
- hooks for reusable controller logic
- testable search utilities

---

# 13. Data Models

## 13.1 TypeScript Models

```ts
export type SupportedLanguage = 'en' | 'ta';

export interface BibleVerse {
  id: string;                 // Example: "JHN-3-16"
  translationId: string;      // Example: "KJV"
  bookNameEn: string;
  bookNameTa: string;
  bookCode: string;           // Example: "JHN"
  chapter: number;
  verse: number;
  textEn?: string;
  textTa?: string;
  transliterationTa?: string; // Optional transliterated Tamil
  keywordsEn: string[];
  keywordsTa: string[];
  themeTags: string[];
}

export interface UserSettings {
  primaryLanguage: SupportedLanguage;
  searchLanguageMode: 'auto' | 'en' | 'ta';
  ttsSpeed: number;           // 0.5 - 2.0
  shakeToSpeakEnabled: boolean;
  hapticsEnabled: boolean;
  dailyPushEnabled: boolean;
  dailyPushTime: string;      // "08:00"
  highContrastMode: boolean;
  dynamicTextScale: boolean;
  autoPlayVerseOnOpen: boolean;
}

export interface FavoriteVerse {
  id: string;
  verseId: string;
  createdAt: string;
  customTag?: string;
}

export interface AudioPlan {
  planId: string;
  titleEn: string;
  titleTa: string;
  descriptionEn?: string;
  descriptionTa?: string;
  totalDays: number;
  currentDay: number;
  dailyVerses: string[][];
  completed: boolean;
}

export interface VoiceReflection {
  noteId: string;
  verseId: string;
  audioFileUri: string;
  durationSeconds: number;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  language: SupportedLanguage | 'auto';
  createdAt: string;
}

export interface DailyVerse {
  id: string;
  verseId: string;
  date: string; // YYYY-MM-DD
}


⸻

14. SQLite Schema

Claude must create migrations/initialization for the following tables:

14.1 verses

Fields:
	•	id TEXT PRIMARY KEY
	•	translation_id TEXT NOT NULL
	•	book_code TEXT NOT NULL
	•	book_name_en TEXT NOT NULL
	•	book_name_ta TEXT NOT NULL
	•	chapter INTEGER NOT NULL
	•	verse INTEGER NOT NULL
	•	text_en TEXT
	•	text_ta TEXT
	•	transliteration_ta TEXT
	•	theme_tags TEXT NOT NULL       // JSON string
	•	keywords_en TEXT NOT NULL      // JSON string
	•	keywords_ta TEXT NOT NULL      // JSON string

Indexes:
	•	(book_code, chapter, verse)
	•	full-text or indexed search fields where practical
	•	optional normalized search columns for fuzzy matching

14.2 favorites
	•	id TEXT PRIMARY KEY
	•	verse_id TEXT NOT NULL
	•	created_at TEXT NOT NULL
	•	custom_tag TEXT

14.3 settings
	•	key TEXT PRIMARY KEY
	•	value TEXT NOT NULL

14.4 reflections
	•	note_id TEXT PRIMARY KEY
	•	verse_id TEXT NOT NULL
	•	audio_file_uri TEXT NOT NULL
	•	duration_seconds INTEGER NOT NULL
	•	created_at TEXT NOT NULL

14.5 search_history
	•	id TEXT PRIMARY KEY
	•	query TEXT NOT NULL
	•	language TEXT NOT NULL
	•	created_at TEXT NOT NULL

14.6 audio_plans
	•	plan_id TEXT PRIMARY KEY
	•	payload TEXT NOT NULL

14.7 daily_verses
	•	id TEXT PRIMARY KEY
	•	verse_id TEXT NOT NULL
	•	date TEXT NOT NULL

⸻

15. Search Architecture

15.1 Search Pipeline

The search engine must follow this order:
	1.	Normalize query
	•	trim
	•	lowercase
	•	remove extra punctuation
	•	normalize whitespace
	2.	Detect search type
	•	verse reference
	•	exact phrase
	•	keyword/theme
	•	emotion/mood
	•	transliteration/Tamil-like input
	3.	Build weighted search candidates
	•	exact reference match highest
	•	exact phrase next
	•	keyword hits next
	•	theme tag matches next
	•	fuzzy similarity next
	•	transliteration similarity next
	4.	Rank results
	•	exact book/chapter/verse highest
	•	exact text match above theme-only match
	•	shorter cleaner matches ranked higher than noisy broad matches
	5.	Return capped result set
	•	top 3 for voice-first summary
	•	top 20 for UI list
	•	raw internal max configurable

15.2 Mood Mapping

Implement a simple local mapping:

const moodToThemes = {
  sad: ['comfort', 'hope', 'peace'],
  anxious: ['peace', 'trust', 'faith'],
  afraid: ['courage', 'protection', 'faith'],
  lonely: ['presence', 'love', 'comfort'],
  thankful: ['praise', 'gratitude', 'joy'],
  guilty: ['forgiveness', 'grace', 'mercy'],
};

This must be local/configurable, not dependent on cloud AI.

⸻

16. Voice Architecture

16.1 Voice Layer Design

Create a SpeechRecognitionAdapter interface.

export interface SpeechRecognitionAdapter {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  startListening(language: 'en-US' | 'ta-IN'): Promise<void>;
  stopListening(): Promise<void>;
  cancelListening(): Promise<void>;
  onPartialResult(callback: (text: string) => void): () => void;
  onFinalResult(callback: (text: string) => void): () => void;
  onError(callback: (error: string) => void): () => void;
}

Create a SpeechService that wraps provider-specific implementation.

16.2 Voice Controller Responsibilities

A central VoiceController / hook must manage:
	•	start listening
	•	stop listening
	•	current listening state
	•	haptic feedback
	•	audio interruption handling
	•	recognized text routing
	•	execution of supported voice commands
	•	coordination with TTS

16.3 Shake-to-Speak

On mobile only:
	•	detect shake gesture
	•	debounce it
	•	avoid accidental multiple triggers
	•	provide haptic confirmation
	•	launch listening flow

⸻

17. TTS Architecture

Create a TTSService that:
	•	speaks text
	•	selects language
	•	stops speech
	•	pauses/resumes if supported
	•	respects playback speed
	•	avoids overlapping speech sessions

Rules:
	1.	If microphone starts, stop TTS first.
	2.	If a phone/audio interruption occurs, pause or stop TTS.
	3.	If verse has both Tamil and English, allow:
	•	current language only
	•	bilingual playback mode later
	4.	All spoken responses must be concise by default.

⸻

18. Notification Architecture

Daily Whisper

Use scheduled local notifications.

Requirements:
	•	user can enable/disable
	•	user can select time
	•	notification opens app to verse detail
	•	verse of the day selected from local dataset
	•	avoid repeated verse for short windows if possible

Fallback:
	•	if notifications denied, app should show accessible settings guidance

⸻

19. UI/UX Requirements

19.1 Design Principles
	•	simple
	•	high contrast
	•	low clutter
	•	large touch targets
	•	obvious primary actions
	•	voice-first entry points
	•	accessible defaults

19.2 Core UI Components

Claude must create reusable components for:
	•	PrimaryButton
	•	IconButtonAccessible
	•	VoiceSearchButton
	•	VerseCard
	•	ResultList
	•	PlaybackControls
	•	SectionHeader
	•	EmptyState
	•	PermissionPromptCard
	•	HighContrastToggle
	•	TtsSpeedControl
	•	FavoriteButton
	•	ReflectionRecorder

19.3 Theme Requirements

Support at least:
	1.	Dark high contrast
	•	black background
	•	white or yellow text
	2.	Light high contrast
	•	white background
	•	black text

No low-contrast decorative UI.

⸻

20. Edge Cases

Claude must explicitly handle these.

Permissions
	1.	Microphone denied
	•	disable voice capture
	•	keep text search fully functional
	•	show clear accessible recovery flow
	2.	Notifications denied
	•	daily verse still visible in app
	•	show instructions to enable later
	3.	Audio recording denied
	•	reflection feature disabled cleanly

Connectivity
	4.	No internet
	•	core verse search still works
	•	favorites still work
	•	TTS still attempts local/native speech path

Data
	5.	Missing Tamil text for a verse
	•	use English fallback
	•	announce fallback if needed
	6.	Missing English text
	•	use Tamil fallback

Search
	7.	Too many results
	•	summarize top results
	•	encourage refinement
	8.	No results
	•	suggest alternate keywords or nearby matches

Audio
	9.	TTS already speaking when listening starts
	•	stop TTS immediately
	10.	User repeatedly taps listen

	•	debounce and avoid duplicate session state

	11.	Voice result is partial or noisy

	•	show text confirmation before destructive actions

Sensors
	12.	Shake false positives

	•	cooldown window required

Accessibility
	13.	Large font scaling breaks layout

	•	all layouts must remain usable

⸻

21. Folder Structure

src/
  app/
    navigation/
    screens/
  components/
    common/
    search/
    verse/
    audio/
    settings/
  services/
    audio/
    speech/
    notifications/
    storage/
    search/
  stores/
  hooks/
  data/
    seed/
    plans/
    dictionaries/
  db/
    migrations/
    repositories/
  utils/
  types/
  constants/


⸻

22. State Management Plan

Use Zustand stores:

22.1 useSettingsStore

Manages:
	•	language
	•	TTS speed
	•	accessibility mode
	•	haptics
	•	daily push settings

22.2 useVoiceStore

Manages:
	•	listening state
	•	recognized transcript
	•	errors
	•	current voice mode

22.3 usePlaybackStore

Manages:
	•	current verse
	•	current queue/context
	•	speaking status
	•	speed
	•	playback mode

22.4 useFavoritesStore

Manages:
	•	favorite IDs
	•	loading state
	•	add/remove actions

22.5 useSearchStore

Manages:
	•	current query
	•	results
	•	recent history
	•	loading/error state

⸻

23. Implementation Phases

Phase 1: App Foundation

Build:
	•	Expo app scaffold
	•	TypeScript strict config
	•	Zustand stores
	•	i18n setup
	•	navigation shell
	•	theme system
	•	reusable accessible UI primitives

Deliverable:
	•	app launches on iOS, Android, Web
	•	settings state persists
	•	basic screens render

Phase 2: Local Data Layer

Build:
	•	SQLite setup
	•	migrations
	•	repositories
	•	seed 50–100 bilingual sample verses
	•	search utility
	•	history/favorites persistence

Deliverable:
	•	local search works offline
	•	verse detail renders from DB

Phase 3: Voice and Audio Layer

Build:
	•	speech recognition adapter
	•	TTS service
	•	haptics integration
	•	voice command parser
	•	shake-to-speak

Deliverable:
	•	user can speak search query
	•	app reads result aloud
	•	TTS and STT do not overlap

Phase 4: Main User Flows

Build:
	•	Home
	•	Search
	•	Verse Detail
	•	Favorites
	•	Settings

Deliverable:
	•	full accessible MVP reading/listening flow works

Phase 5: Daily Whisper

Build:
	•	notification scheduler
	•	daily verse resolver
	•	open-to-verse notification action

Deliverable:
	•	local daily notifications work
	•	selected verse opens correctly

Phase 6: Reflection + Memorization

Build:
	•	audio reflections
	•	local file storage
	•	simple memorization mode
	•	chunked verse practice

Deliverable:
	•	user can record and replay reflections
	•	memorization mode is usable

Phase 7: Phase 2 Extensions

Build only after MVP is stable:
	•	plans
	•	cross references
	•	simplified summaries
	•	historical context
	•	fill-in-the-blanks

⸻

24. Testing Requirements

24.1 Unit Tests

Test:
	•	search normalization
	•	reference parsing
	•	fuzzy ranking logic
	•	mood-to-theme mapping
	•	command parsing
	•	settings reducers/store actions

24.2 Integration Tests

Test:
	•	search screen flow
	•	favorite save/remove flow
	•	voice transcript -> search result flow
	•	daily verse notification open flow

24.3 Manual QA Checklist
	1.	Voice search works on mobile
	2.	Text search works on web
	3.	Screen reader announces controls properly
	4.	TTS reads selected verse
	5.	TTS stops when microphone starts
	6.	Favorites persist after restart
	7.	Offline search still works
	8.	Contrast mode remains usable
	9.	Large text scaling does not destroy layout

⸻

25. Acceptance Criteria

The MVP is complete only if all of the following are true:
	1.	User can search verse content in English and Tamil
	2.	User can trigger voice search on mobile
	3.	User can hear verse playback
	4.	User can bookmark a verse
	5.	User can ask for context and hear more verses
	6.	User can receive a daily verse notification
	7.	User can change TTS speed
	8.	User can use the app offline for core features
	9.	User can use the app with screen reader enabled
	10.	Permissions failure does not break the app
	11.	App remains usable in high-contrast mode
	12.	Reflection recording works locally
	13.	Basic memorization mode works

⸻

26. Explicit Build Priorities

Claude must prioritize in this order:
	1.	Accessibility
	2.	Core verse search
	3.	Offline data reliability
	4.	Voice input/output stability
	5.	Simplicity of UX
	6.	Maintainable code structure
	7.	Secondary enrichment features

Do not sacrifice accessibility or reliability just to ship fancy features.

⸻

27. Explicit Non-Goals for MVP

Do not spend time building:
	•	auth
	•	cloud backend
	•	social feed
	•	real-time rooms
	•	live chat
	•	moderation tools
	•	server-managed profiles
	•	analytics dashboards
	•	payment systems
	•	content admin panels

⸻

28. Final Delivery Instruction for Claude

Build the app iteratively, phase by phase.
Do not dump everything into one pass.

For each phase:
	1.	create the code
	2.	keep it modular
	3.	keep it typed
	4.	keep it runnable
	5.	avoid hidden assumptions
	6.	add TODOs only where a feature is explicitly deferred

When implementation choices are ambiguous, choose the option that is:
	•	more accessible
	•	simpler to maintain
	•	more offline-capable
	•	less dependent on external services

The hard truth: your original version was trying to build an accessibility app, a devotional app, a memorization app, an LLM explainer, and a Christian social network all at once. That’s how projects get half-built and abandoned. This version gives Claude a sane build path.
