import { config } from '../../config/env';
import { buildPrompt } from '../../utils/prompt-builder';
import { AiInput, AiOutput, AiProvider } from './types';

interface OpenRouterChoice {
  message?: {
    content?: string;
  };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  error?: {
    message?: string;
  };
}

export class OpenRouterProvider implements AiProvider {
  readonly name = 'openrouter';
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly timeoutMs = 15_000;

  // Free models used when the configured (paid) model fails — e.g. 402 when
  // the account is out of credits. Their Tamil output is unreliable (mixed
  // scripts), so Tamil requests skip them and fall through to Gemini instead.
  private readonly freeFallbackModels = [
    'nvidia/nemotron-3.5-lightning:free',
    'openrouter/free',
  ];

  private modelsFor(input: AiInput): string[] {
    if (input.language === 'Tamil') return [config.openrouterModel];
    return Array.from(new Set([config.openrouterModel, ...this.freeFallbackModels]));
  }

  constructor() {
    if (!config.openrouterApiKey) {
      console.warn('[openrouter] API key not configured');
    }
  }

  async generateExplanation(input: AiInput): Promise<AiOutput> {
    const { systemPrompt, userMessage } = buildPrompt(input);

    let lastError: Error | null = null;

    const models = this.modelsFor(input);
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      // Give fallback models a shorter timeout to fail fast
      const timeout = i === 0 ? this.timeoutMs : 10_000;
      try {
        return await this.callModel(model, systemPrompt, userMessage, timeout);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // A bad key fails the same way on every model — stop early.
        if (lastError.message.includes('returned 401')) throw lastError;
        console.warn(`[openrouter] Model ${model} failed: ${lastError.message.slice(0, 200)}. Trying next...`);
      }
    }

    throw lastError ?? new Error('OpenRouter: all models exhausted');
  }

  private async callModel(model: string, systemPrompt: string, userMessage: string, timeoutOverride?: number): Promise<AiOutput> {
    const ms = timeoutOverride ?? this.timeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://heavenly-push.app',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          // Tamil is token-heavy; leave room for the full JSON answer.
          max_tokens: 2500,
          // Free models like Nemotron reason by default and can burn the whole
          // budget thinking (empty content, ~20s). Answers must be fast.
          reasoning: { enabled: false },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        throw new Error(`OpenRouter API returned ${response.status}: ${errorBody}`);
      }

      const data = (await response.json()) as OpenRouterResponse;

      if (data.error) {
        throw new Error(`OpenRouter error: ${data.error.message ?? 'Unknown'}`);
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenRouter returned empty response');
      }

      console.log(`[openrouter] Success with model: ${model}`);
      return this.parseResponse(content);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`OpenRouter request timed out after ${ms}ms`);
      }
      if (err instanceof Error && err.message.startsWith('OpenRouter')) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`OpenRouter generation failed: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://heavenly-push.app',
          },
          body: JSON.stringify({
            model: config.openrouterModel,
            messages: [{ role: 'user', content: 'Say "ok"' }],
            max_tokens: 5,
            reasoning: { enabled: false },
          }),
          signal: controller.signal,
        });
        return response.ok;
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      return false;
    }
  }

  private parseResponse(text: string): AiOutput {
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as { explanation?: string; shortSummary?: string };
      if (!parsed.explanation || !parsed.shortSummary) {
        throw new Error('Missing required fields in AI response');
      }
      return {
        explanation: parsed.explanation,
        shortSummary: parsed.shortSummary,
        provider: this.name,
      };
    } catch {
      console.warn('[openrouter] Failed to parse JSON response, using raw text');
      return {
        explanation: text.trim(),
        shortSummary: text.trim().slice(0, 100),
        provider: this.name,
      };
    }
  }
}
