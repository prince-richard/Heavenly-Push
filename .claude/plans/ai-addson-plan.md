Read the existing repository first and treat the current app structure as the starting point.

I want you to add a verse-grounded Bible AI assistant feature to the existing app in a controlled, production-oriented way.

This feature must support TWO AI providers:
1. Google Gemini as the primary provider
2. OpenRouter free-tier models as the secondary/fallback provider

IMPORTANT:
- Do not hardcode the app around one AI vendor.
- Build a clean provider abstraction from the start.
- Keep all API keys server-side only.
- Do not trust model memory for quoting scripture. Always ground responses in fetched verse text.

GOAL
Add a Bible AI assistant that can answer questions like:
- "Explain John 3:16"
- "What does this verse mean?"
- "Show this verse in English and Tamil"
- "Summarize this verse for a beginner"
- "What is the lesson from this verse?"

The assistant must always ground its answer in actual verse text fetched from a Bible API and must not rely on model memory for scripture quotes.

WORKFLOW
1. Inspect the repository fully before making changes.
2. Do not start coding immediately. First assess the repo and propose the plan.
3. Then implement this feature in small steps.
4. Stop after each major step and summarize changes.

ARCHITECTURE TO IMPLEMENT

1. Repo assessment
- Inspect the current frontend and backend structure.
- Identify framework, routing, state management, environment variable setup, API calling patterns, and where this feature should fit.
- Identify whether there is already a backend or API layer to extend.

2. Bible provider abstraction
Create a provider interface for scripture retrieval, for example:
- getVerse(reference, language/version)
- getParallelVerse(reference, englishVersion, tamilVersion)
- searchVerses(query, language/version) if needed later

Implement:
- BollsBibleProvider as the first working provider

Design requirements:
- Put translation/version mapping in configuration, not scattered in code.
- Normalize/sanitize returned HTML verse text before sending it to Gemini/OpenRouter or to the frontend.
- Keep the provider swappable so another Bible API can be added later if needed.

3. AI provider abstraction
Create an AI provider interface, for example:
- generateExplanation(input)
- generateStructuredAnswer(input)
- healthCheck()

Implement:
- GeminiAiProvider
- OpenRouterAiProvider

Required behavior:
- The app must support selecting the provider by config/env.
- The app must support fallback order, for example:
  - primary: Gemini
  - secondary: OpenRouter
- The app must fail gracefully if one provider is unavailable.
- The provider layer must hide vendor-specific request details from business logic.

4. AI configuration
Use environment variables/config for:
- AI_PROVIDER_PRIMARY
- AI_PROVIDER_SECONDARY
- GEMINI_API_KEY
- GEMINI_MODEL
- OPENROUTER_API_KEY
- OPENROUTER_MODEL
- ENGLISH_BIBLE_VERSION
- TAMIL_BIBLE_VERSION

Rules:
- Do not hardcode Gemini 1.5 Flash in business logic.
- Do not hardcode a specific OpenRouter free model in core logic unless it is only the default config value.
- Make the default OpenRouter option either:
  - openrouter/free
  or
  - a configurable specific :free model

5. Supported AI execution modes
Support these modes:
- explicit provider selection by request
- default primary provider from env
- automatic fallback to secondary provider on failure
- optional provider metadata in the response for debugging/admin use

6. Backend AI flow
Build the flow like this:
- user submits a question
- system detects whether the question contains a Bible reference
- if reference exists, fetch actual verse text from the Bible provider
- optionally fetch both English and Tamil text for the same reference
- build a constrained prompt using only fetched verse text as source context
- send the same logical prompt through the selected AI provider
- return structured JSON to frontend:
  - reference
  - englishVerse
  - tamilVerse
  - explanation
  - shortSummary
  - providerUsed
  - fallbackUsed
  - warnings or fallback state

7. Prompting rules for all AI providers
The model must be instructed to:
- explain only from the provided verse context
- never invent or present a quotation unless it is present in the fetched verse text
- clearly separate:
  - verse text
  - explanation
  - summary
- say when context is insufficient
- keep the response concise, respectful, and UI-friendly
- prefer structured JSON output if practical

The prompt builder must be shared across providers so Gemini and OpenRouter use the same grounding logic.

8. Endpoint design
Create backend endpoints such as:
- POST /api/ai-bible/explain
- optional GET /api/bible/verse?reference=John%203:16&lang=en
- optional GET /api/bible/parallel?reference=John%203:16

The explain endpoint should accept:
- question
- reference (optional if parsed from question)
- preferredLanguage
- includeParallelText boolean
- provider (optional explicit override)

9. Frontend feature
Add a simple UI component that:
- lets the user enter a question
- optionally enter or confirm a Bible reference
- optionally choose AI provider if enabled in UI
- shows:
  - reference
  - original verse in English
  - original verse in Tamil
  - AI explanation
  - summary
  - loading/error states
  - provider used

If the app already has a verse detail page, integrate the assistant there instead of building a disconnected screen.

10. Fallback behavior
Handle these cases:
- reference not found
- Bible provider unavailable
- Tamil verse unavailable
- Gemini error or timeout
- OpenRouter error or timeout
- both AI providers fail
- broad theological question without a clear verse reference

Fallback rules:
- If primary AI provider fails, attempt secondary automatically if configured.
- If both AI providers fail but verse text exists, return the verse text and a graceful explanation that AI summary is currently unavailable.
- If the question is too broad and no verse is identified, either:
  - ask the user to provide a verse/reference
  - or provide a clearly marked general response if product rules allow it

11. Caching and performance
Add lightweight server-side caching for:
- verse lookups by provider/version/reference
- AI responses keyed by normalized question + reference + language + provider + version combination where appropriate

Avoid repeated Bible API calls for the same verse and repeated AI calls for identical requests where possible.

12. Observability
Add logs for:
- parsed reference
- Bible provider used
- AI provider requested
- AI provider actually used
- whether fallback occurred
- verse lookup success/failure
- AI request success/failure

Do not log API keys or sensitive user data.

13. Testing
Add tests for:
- reference parsing
- Bible provider normalization
- HTML-to-text sanitation
- prompt builder
- Gemini provider wrapper
- OpenRouter provider wrapper
- provider fallback logic
- explain endpoint success/failure flows

14. Documentation
Update project docs with:
- required environment variables
- how to choose Gemini vs OpenRouter
- how fallback works
- how to configure OpenRouter free router vs specific free model
- known limitations, including that free-tier model availability can vary

IMPLEMENTATION STRATEGY

Step 1:
Inspect the repo and produce:
- repo assessment
- proposed architecture
- files to create/update
- risks/assumptions
Do not code yet.

Step 2:
Implement Bible provider abstraction and one working Bible provider.

Step 3:
Implement AI provider abstraction with:
- GeminiAiProvider
- OpenRouterAiProvider
- shared prompt builder
- fallback manager / orchestrator

Step 4:
Implement explain service and backend endpoint.

Step 5:
Implement frontend UI integration.

Step 6:
Add tests, docs, and cleanup.

IMPORTANT CONSTRAINTS
- Do not hardcode old Gemini SDK usage.
- Do not hardcode one model name in core business logic.
- Do not hardcode the app around Gemini only.
- Do not trust AI memory for scripture text.
- Do not skip Bible text normalization.
- Do not expose API keys in client code.
- Do not turn this into a giant generic chatbot framework.
- Keep it focused on verse-grounded explanation with clean provider abstraction.

OUTPUT FORMAT FOR EACH STEP
After each step, provide:
1. what you changed
2. files created/updated
3. why you chose that approach
4. blockers or assumptions
5. validation performed

Start now with Step 1 only:
inspect the repo, assess what exists, and propose the architecture and replan it before writing code.