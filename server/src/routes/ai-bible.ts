import { Router, Request, Response } from 'express';
import {
  explainVerse,
  chatAboutBible,
  searchBibleWithAi,
  getAiDailyVerse,
  askAnything,
  ExplainError,
} from '../services/explain-service';
import { parseReference } from '../utils/reference-parser';
import { BollsBibleProvider } from '../providers/bible/bolls-bible-provider';
import { healthCheckAll, getProviderHealth } from '../services/ai-fallback-manager';
import { config } from '../config/env';
import { metricsStore } from '../services/metrics-store';

const router = Router();
const bibleProvider = new BollsBibleProvider();

function friendlyError(err: unknown, language?: string): { message: string; code: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const isTa = language === 'ta';

  if (raw.includes('429') || raw.includes('quota') || raw.includes('rate limit') || raw.includes('rate-limit')) {
    return {
      message: isTa
        ? 'சேவையகம் இப்போது மிகவும் பரபரப்பாக உள்ளது. சில நொடிகளில் மீண்டும் முயற்சிக்கவும்.'
        : 'The server is busy right now. Please try again in a few seconds.',
      code: 'RATE_LIMITED',
    };
  }
  if (raw.includes('timed out') || raw.includes('timeout')) {
    return {
      message: isTa
        ? 'பதில் பெற நேரம் அதிகமாகிவிட்டது. மீண்டும் முயற்சிக்கவும்.'
        : 'The request took too long. Please try again.',
      code: 'TIMEOUT',
    };
  }
  if (raw.includes('network') || raw.includes('ECONNREFUSED') || raw.includes('fetch failed')) {
    return {
      message: isTa
        ? 'இணைய இணைப்பில் சிக்கல் உள்ளது. உங்கள் இணையத்தை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
        : 'Connection issue. Please check your internet and try again.',
      code: 'NETWORK_ERROR',
    };
  }
  return {
    message: isTa
      ? 'ஏதோ தவறு நடந்தது. சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.'
      : 'Something went wrong. Please try again in a moment.',
    code: 'AI_ERROR',
  };
}

// POST /api/ai-bible/explain
router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { question, reference, preferredLanguage, includeParallelText, provider } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Missing required field: question', code: 'MISSING_QUESTION' });
      return;
    }

    const result = await explainVerse({
      question,
      reference,
      preferredLanguage: preferredLanguage === 'ta' ? 'ta' : 'en',
      includeParallelText: includeParallelText !== false,
      provider,
    });

    metricsStore.logAiCall(result.providerUsed, question, reference, result.fallbackUsed, true);
    res.json(result);
  } catch (err) {
    metricsStore.logAiCall('unknown', req.body?.question ?? '', req.body?.reference, false, false);
    if (err instanceof ExplainError) {
      res.status(400).json({ error: err.message, code: err.code });
      return;
    }
    const raw = err instanceof Error ? err.message : 'Internal server error';
    console.error('[ai-bible] explain error:', raw);
    const friendly = friendlyError(err, req.body?.preferredLanguage);
    res.status(500).json({ error: friendly.message, code: friendly.code });
  }
});

// POST /api/ai-bible/chat
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { question, preferredLanguage } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Missing required field: question', code: 'MISSING_QUESTION' });
      return;
    }

    const result = await chatAboutBible({
      question,
      preferredLanguage: preferredLanguage === 'ta' ? 'ta' : 'en',
    });

    metricsStore.logAiCall(result.providerUsed, question, undefined, false, true);
    res.json(result);
  } catch (err) {
    metricsStore.logAiCall('unknown', req.body?.question ?? '', undefined, false, false);
    if (err instanceof ExplainError) {
      res.status(400).json({ error: err.message, code: err.code });
      return;
    }
    const raw = err instanceof Error ? err.message : 'Internal server error';
    console.error('[ai-bible] chat error:', raw);
    const friendly = friendlyError(err, req.body?.preferredLanguage);
    res.status(500).json({ error: friendly.message, code: friendly.code });
  }
});

// POST /api/ai-bible/ask  { question, hintedLanguage? }
// Returns: { answer, verses[], detectedLanguage, providerUsed }
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question, hintedLanguage } = req.body;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Missing required field: question', code: 'MISSING_QUESTION' });
      return;
    }
    const result = await askAnything({
      question,
      hintedLanguage:
        hintedLanguage === 'ta' ? 'ta' : hintedLanguage === 'en' ? 'en' : undefined,
    });
    metricsStore.logAiCall(result.providerUsed, question, undefined, false, true);
    res.json(result);
  } catch (err) {
    metricsStore.logAiCall('unknown', req.body?.question ?? '', undefined, false, false);
    const raw = err instanceof Error ? err.message : 'Internal server error';
    console.error('[ai-bible] ask error:', raw);
    const friendly = friendlyError(err, req.body?.hintedLanguage);
    res.status(500).json({ error: friendly.message, code: friendly.code });
  }
});

// POST /api/ai-bible/search  { query, preferredLanguage, limit? }
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, preferredLanguage, limit } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Missing required field: query', code: 'MISSING_QUERY' });
      return;
    }
    const result = await searchBibleWithAi({
      query,
      preferredLanguage: preferredLanguage === 'ta' ? 'ta' : 'en',
      limit: typeof limit === 'number' ? limit : undefined,
    });
    metricsStore.logAiCall(result.providerUsed, query, undefined, false, true);
    res.json(result);
  } catch (err) {
    metricsStore.logAiCall('unknown', req.body?.query ?? '', undefined, false, false);
    const raw = err instanceof Error ? err.message : 'Internal server error';
    console.error('[ai-bible] search error:', raw);
    const friendly = friendlyError(err, req.body?.preferredLanguage);
    res.status(500).json({ error: friendly.message, code: friendly.code });
  }
});

// GET /api/ai-bible/daily?lang=en|ta
router.get('/daily', async (req: Request, res: Response) => {
  try {
    const lang = req.query.lang === 'ta' ? 'ta' : 'en';
    const result = await getAiDailyVerse(lang);
    metricsStore.logAiCall(result.providerUsed, 'daily-verse', undefined, false, true);
    res.json(result);
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Internal server error';
    console.error('[ai-bible] daily error:', raw);
    const friendly = friendlyError(err, req.query.lang as string);
    res.status(500).json({ error: friendly.message, code: friendly.code });
  }
});

// GET /api/bible/verse?ref=John+3:16
router.get('/verse', async (req: Request, res: Response) => {
  try {
    const ref = req.query.ref as string;
    if (!ref) {
      res.status(400).json({ error: 'Missing query parameter: ref', code: 'MISSING_REF' });
      return;
    }

    const parsed = parseReference(ref);
    if (!parsed) {
      res.status(400).json({ error: `Could not parse reference: ${ref}`, code: 'INVALID_REFERENCE' });
      return;
    }

    const result = await bibleProvider.getVerse(parsed, config.englishBibleVersion);
    metricsStore.logBibleLookup(ref);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message, code: 'BIBLE_ERROR' });
  }
});

// GET /api/bible/parallel?ref=John+3:16
router.get('/parallel', async (req: Request, res: Response) => {
  try {
    const ref = req.query.ref as string;
    if (!ref) {
      res.status(400).json({ error: 'Missing query parameter: ref', code: 'MISSING_REF' });
      return;
    }

    const parsed = parseReference(ref);
    if (!parsed) {
      res.status(400).json({ error: `Could not parse reference: ${ref}`, code: 'INVALID_REFERENCE' });
      return;
    }

    const result = await bibleProvider.getParallelVerse(
      parsed,
      config.englishBibleVersion,
      config.tamilBibleVersion
    );
    metricsStore.logBibleLookup(ref);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message, code: 'BIBLE_ERROR' });
  }
});

// GET /api/ai-bible/health
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const providers = await healthCheckAll();
    const health = getProviderHealth();
    const allHealthy = Object.values(providers).every(Boolean);
    res.json({
      status: allHealthy ? 'ok' : 'degraded',
      providers,
      details: health,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', providers: {} });
  }
});

export { router as aiBibleRouter };
