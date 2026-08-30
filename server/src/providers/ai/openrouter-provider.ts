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
  private readonly timeoutMs = 30_000;

  // Multiple free models from different upstream providers for rate-limit resilience
  private readonly fallbackModels: string[] = [
    config.openrouterModel,
    'nvidia/nemotron-3.5-lightning:free',
    'minimax/minimax-m3:free',
    'z-ai/glm-5.2:free',
  ];

  constructor() {
    if (!config.openrouterApiKey) {
      console.warn('[openrouter] API key not configured');
    }
  }

  async generateExplanation(input: AiInput): Promise<AiOutput> {
    const { systemPrompt, userMessage } = buildPrompt(input);

    let lastError: Error | null = null;

    for (let i = 0; i < this.fallbackModels.length; i++) {
      const model = this.fallbackModels[i];
      // Give fallback models a shorter timeout to fail fast
      const timeout = i === 0 ? this.timeoutMs : 15_000;
      try {
        const result = await this.callModel(model, systemPrompt, userMessage, timeout);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isTransient = lastError.message.includes('429') || lastError.message.includes('rate') || lastError.message.includes('timed out') || lastError.message.includes('timeout');
        if (isTransient) {
          console.warn(`[openrouter] Model ${model} failed (${isTransient ? 'transient' : 'error'}), trying next...`);
          continue;
        }
        // Hard error — don't try other models
        throw lastError;
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
        throw new Error(`OpenRouter request timed out after ${this.timeoutMs}ms`);
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
