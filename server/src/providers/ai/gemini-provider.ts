import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env';
import { buildPrompt } from '../../utils/prompt-builder';
import { AiInput, AiOutput, AiProvider } from './types';

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;
  private readonly timeoutMs = 15_000;

  constructor() {
    if (!config.geminiApiKey) {
      console.warn('[gemini] API key not configured');
    }
    this.client = new GoogleGenerativeAI(config.geminiApiKey);
    this.modelName = config.geminiModel;
  }

  async generateExplanation(input: AiInput): Promise<AiOutput> {
    const { systemPrompt, userMessage } = buildPrompt(input);

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      });

      const response = result.response;
      const text = response.text();

      return this.parseResponse(text);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Gemini request timed out after ${this.timeoutMs}ms`);
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Gemini generation failed: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent('Say "ok"');
      return !!result.response.text();
    } catch {
      return false;
    }
  }

  private parseResponse(text: string): AiOutput {
    // Strip markdown code fences if present
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
    } catch (parseErr: unknown) {
      // If JSON parsing fails, use the raw text as explanation
      console.warn('[gemini] Failed to parse JSON response, using raw text');
      return {
        explanation: text.trim(),
        shortSummary: text.trim().slice(0, 100),
        provider: this.name,
      };
    }
  }
}
