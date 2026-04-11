# Heavenly Push

> **A voice-first, bilingual (English + Tamil) AI Bible companion built for the visually impaired, the elderly, and anyone who would rather speak than type.**

Heavenly Push turns the Bible into a conversation. Tap once. Ask anything in English or Tamil. Hear the answer read aloud, with the verses that back it up — and pull up any verse with another tap.

---

## Why this exists

Most Bible apps are designed for sighted, tech-fluent users who can scroll, search, and tap precisely. That leaves out a huge audience:

- **People who are blind or have low vision** — can't read tiny fonts or aim at small icons.
- **The elderly** — physical buttons and oversized targets matter; voice is a far more natural interface.
- **People with low digital literacy** — typing references like `John 3:16` is a barrier.
- **Bilingual Tamil/English households** — most apps force a single language at sign-up.

Heavenly Push is built for them first. Sighted users get the same clean experience as a side effect.

---

## What it does

### One button. Ask anything.

The home screen is dominated by a giant tappable hero card. **Tap anywhere on the card to start listening. Tap again to stop.** That's it. Visually impaired users don't have to aim at a small mic icon — the entire card is the button.

Ask in your own words:

- *"What does the Bible say about forgiveness?"*
- *"Find me verses about hope when I feel alone."*
- *"அன்பைப் பற்றி வேதம் என்ன சொல்கிறது?"*  (What does the Bible say about love?)
- *"John chapter 3 verse 16"*

The AI replies **in the same language you asked in**, reads the answer aloud, and shows a list of relevant verses you can tap to open.

### Bilingual by design

Tamil and English aren't an afterthought:

- **Auto-detect** — type/speak in either script and the AI picks up on it automatically (Unicode block-based detection on the server).
- **One-tap language toggle** — an `EN / தமிழ்` pill at the top of the home screen flips the speech recognition language without digging into Settings.
- **Voice command:** *"Speak in Tamil"* / *"Switch to English"* — change languages without lifting a finger.
- **Bilingual verses** — when the AI returns verses, both English and Tamil text are stored so the user can see whichever they prefer.

### Voice commands for everything

Once the mic is open, the assistant understands more than just questions:

| Say | What happens |
|---|---|
| *"Verses about hope"* | Lists hopeful verses, reads the answer aloud |
| *"What does the Bible say about love"* | Direct AI question |
| *"Open favorites"* | Navigate to the Favorites tab |
| *"Open settings"* | Navigate to Settings |
| *"Speak in Tamil"* / *"Speak in English"* | Toggle recognition language |
| *"Slow down"* / *"Speed up"* | Adjust TTS speed |
| *"Stop"* | Stop the audio playback |
| *"Repeat"* | Replay the last answer (works from any screen) |
| *"Read this"* | Read the currently open verse aloud |
| *"Bookmark this"* | Save the current verse to favorites |

The voice command parser is deterministic prefix-matching (no LLM round-trip), so commands respond instantly.

### Other niceties for accessibility

- **High-contrast purple theme** with large fonts and 44+pt touch targets everywhere
- **Haptic feedback** on every meaningful action (configurable)
- **Shake to speak** — physically shake the phone to start listening
- **Daily verse** — a fresh Bible verse every day, in your chosen language
- **Favorites** — save verses with one tap, persisted locally via AsyncStorage
- **Reading plans** (curated, multi-day Bible study journeys)
- **Full screen reader support** — VoiceOver and TalkBack tested across every screen

---

## How it works

```
┌─────────────────────────────┐         ┌────────────────────────────┐
│   Expo / React Native App   │  HTTPS  │  Express backend on Vercel │
│   iOS · Android · Web       │ ──────► │  /api/ai-bible/ask         │
│                             │         │  /api/ai-bible/daily       │
│   Tap → STT → text          │         │  /api/ai-bible/parallel    │
│   ◄── Streamed text + TTS   │         │                            │
└─────────────────────────────┘         │  Gemini  ◄─►  OpenRouter   │
                                        │  (primary)    (fallback)   │
                                        │                            │
                                        │  Bolls Bible API           │
                                        │  (verse grounding)         │
                                        └────────────────────────────┘
```

- **No local Bible storage.** Every verse is fetched from the AI backend at request time, then cached. The app stays small and always serves the freshest content.
- **Two-provider AI fallback.** Gemini is the default; if it fails, the request transparently retries against OpenRouter so the user never sees a dead-end error.
- **Verse grounding via Bolls Bible API** — the AI returns references, and the backend fetches the canonical text so quotes are always accurate (no hallucinated chapter numbers).
- **Server-side caching** — `SimpleCache` with 10-minute TTL for ask responses and 24-hour TTL for daily verses. Keeps the LLM bill predictable and responses snappy.

---

## Tech stack

### Client (Expo / React Native)

| Concern | Choice |
|---|---|
| Framework | Expo SDK + React Native (iOS, Android, Web) |
| Language | TypeScript `strict: true` |
| Navigation | React Navigation (bottom tabs + native stack) |
| State | Zustand with AsyncStorage `persist` middleware |
| i18n | i18next + react-i18next + expo-localization |
| Speech-to-text | `@react-native-voice/voice` (native) + Web Speech API (web) |
| Text-to-speech | `expo-speech` |
| Haptics & sensors | `expo-haptics`, `expo-sensors` (shake) |
| Auth | Google sign-in + guest mode |
| Styling | NativeWind (Tailwind for React Native) |

### Backend (Express + Vercel Functions)

| Concern | Choice |
|---|---|
| Runtime | Node.js on Vercel Functions (Fluid Compute) |
| Framework | Express, exposed via `api/index.ts` serverless entry |
| AI providers | Google Gemini (primary), OpenRouter (fallback) |
| Bible data | Bolls Bible API |
| Caching | In-memory `SimpleCache` (per-instance) |
| Observability | `metrics-store` for AI call counts and latency |

### Deployment

The app ships as one Vercel project:

- **Web build** (`expo export --platform web`) is served from the Vercel CDN.
- **Backend API** runs as Vercel Functions in the same project, so the web client can use same-origin `fetch` calls and the native client points at `https://heavenly-push.vercel.app`.
- **Native builds** are produced via `eas build` for iOS and Android (development build required for `@react-native-voice/voice`).

---

## Project layout

```
heavenly-push/
├── src/                    # Expo / React Native client
│   ├── app/                # Screens + navigation
│   │   ├── navigation/     # Tab + root navigators, global navigationRef
│   │   └── screens/        # Home (assistant), Favorites, Plans, Settings, ...
│   ├── components/         # Common, verse, audio, settings UI
│   ├── services/
│   │   ├── ai/             # AiBibleService — fetches /api/ai-bible/*
│   │   ├── speech/         # STT adapters + voice command parser
│   │   └── audio/          # TTS service
│   ├── stores/             # Zustand stores (settings, voice, favorites, ...)
│   ├── hooks/              # useVoiceController, useShakeDetector, useTTS, ...
│   ├── i18n/               # English + Tamil UI strings
│   └── types/              # Strict TypeScript models
└── server/                 # Express backend (deployed as Vercel Functions)
    └── src/
        ├── routes/         # /api/ai-bible/* endpoints
        ├── services/       # explain-service (ask, daily, search), fallback manager
        ├── providers/      # Gemini, OpenRouter, Bolls Bible
        └── utils/          # Reference parsing, language detection, JSON extraction
```

---

## Running locally

### Client

```bash
npm install
npx expo start
```

Press `i` for iOS simulator, `a` for Android emulator, `w` for web.

> **Note:** Voice features require a development build (`npx expo prebuild` + `npx expo run:ios` / `run:android`). Expo Go does not include the native voice module.

### Backend

```bash
cd server
npm install
npm run dev
```

Set the following environment variables in `server/.env`:

```env
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
ENGLISH_BIBLE_VERSION=KJV
TAMIL_BIBLE_VERSION=Tamil
```

The dev server listens on `http://localhost:3001`. The client automatically points there when `__DEV__` is true.

### Deploying

Push to `main`. Vercel rebuilds the web app + serverless functions automatically. Native builds are produced via EAS:

```bash
eas build --platform ios
eas build --platform android
```

---

## Roadmap

- **Phase 1–4** (shipped): foundation, AI-first architecture, voice assistant, bilingual flows, favorites, daily verse, reading plans.
- **Phase 5**: Daily push notifications (local + remote).
- **Phase 6**: Voice reflections (record your thoughts on a verse) and chunked memorization practice.
- **Phase 7**: Cross-references, chapter summaries, historical context, fill-in-the-blanks memorization games.

---

## Contact

Heavenly Push is an independent project. For partnership, accessibility feedback, or to support the work, please reach out via the GitHub issues on this repo.
