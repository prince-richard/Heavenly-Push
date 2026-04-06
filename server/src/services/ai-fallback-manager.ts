import { AiInput, AiOutput, AiProvider } from '../providers/ai/types';
import { GeminiProvider } from '../providers/ai/gemini-provider';
import { OpenRouterProvider } from '../providers/ai/openrouter-provider';
import { config } from '../config/env';

const providers: Record<string, () => AiProvider> = {
  gemini: () => new GeminiProvider(),
  openrouter: () => new OpenRouterProvider(),
};

let primaryInstance: AiProvider | null = null;
let secondaryInstance: AiProvider | null = null;

function getPrimary(): AiProvider {
  if (!primaryInstance) {
    const factory = providers[config.aiProviderPrimary];
    if (!factory) throw new Error(`Unknown AI provider: ${config.aiProviderPrimary}`);
    primaryInstance = factory();
  }
  return primaryInstance;
}

function getSecondary(): AiProvider | null {
  if (!config.aiProviderSecondary) return null;
  if (!secondaryInstance) {
    const factory = providers[config.aiProviderSecondary];
    if (!factory) return null;
    secondaryInstance = factory();
  }
  return secondaryInstance;
}

export interface FallbackResult {
  output: AiOutput;
  fallbackUsed: boolean;
  warnings: string[];
}

export async function generateWithFallback(input: AiInput): Promise<FallbackResult> {
  const warnings: string[] = [];
  const primary = getPrimary();

  try {
    const output = await primary.generateExplanation(input);
    return { output, fallbackUsed: false, warnings };
  } catch (primaryErr) {
    const primaryMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.error(`[ai-fallback] Primary (${primary.name}) failed: ${primaryMsg}`);
    warnings.push(`Primary provider (${primary.name}) failed: ${primaryMsg}`);

    const secondary = getSecondary();
    if (!secondary) {
      throw new Error(`AI generation failed (${primary.name}): ${primaryMsg}`);
    }

    try {
      const output = await secondary.generateExplanation(input);
      return { output, fallbackUsed: true, warnings };
    } catch (secondaryErr) {
      const secondaryMsg = secondaryErr instanceof Error ? secondaryErr.message : String(secondaryErr);
      console.error(`[ai-fallback] Secondary (${secondary.name}) also failed: ${secondaryMsg}`);
      warnings.push(`Secondary provider (${secondary.name}) failed: ${secondaryMsg}`);
      throw new Error(`All AI providers failed. Primary: ${primaryMsg}. Secondary: ${secondaryMsg}`);
    }
  }
}

export async function healthCheckAll(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  const primary = getPrimary();
  results[primary.name] = await primary.healthCheck();

  const secondary = getSecondary();
  if (secondary) {
    results[secondary.name] = await secondary.healthCheck();
  }

  return results;
}
