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

// Track provider health for smart routing
const providerHealth: Record<string, { healthy: boolean; lastCheck: number; consecutiveFailures: number }> = {};

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

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  // Don't retry 429 rate limits — the provider already handles model fallback internally
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('rate-limit') || msg.includes('quota')) {
    return false;
  }
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('network') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('fetch failed')
  );
}

async function retryWithBackoff(
  provider: AiProvider,
  input: AiInput,
  maxRetries: number = 1,
): Promise<AiOutput> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const output = await provider.generateExplanation(input);
      // Mark provider as healthy on success
      providerHealth[provider.name] = { healthy: true, lastCheck: Date.now(), consecutiveFailures: 0 };
      return output;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries && isRetryableError(err)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
        console.warn(`[ai-fallback] ${provider.name} attempt ${attempt + 1} failed (retryable): ${lastError.message}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  // Mark provider as unhealthy
  const health = providerHealth[provider.name] ?? { healthy: true, lastCheck: 0, consecutiveFailures: 0 };
  health.healthy = false;
  health.lastCheck = Date.now();
  health.consecutiveFailures++;
  providerHealth[provider.name] = health;

  throw lastError ?? new Error(`${provider.name} generation failed`);
}

export interface FallbackResult {
  output: AiOutput;
  fallbackUsed: boolean;
  warnings: string[];
}

export async function generateWithFallback(input: AiInput): Promise<FallbackResult> {
  const warnings: string[] = [];
  const primary = getPrimary();
  const secondary = getSecondary();

  // Smart routing: if primary has too many consecutive failures recently, try secondary first
  const primaryHealth = providerHealth[primary.name];
  const shouldSwapOrder =
    secondary &&
    primaryHealth &&
    !primaryHealth.healthy &&
    primaryHealth.consecutiveFailures >= 3 &&
    Date.now() - primaryHealth.lastCheck < 5 * 60 * 1000; // within last 5 min

  const first = shouldSwapOrder ? secondary! : primary;
  const second = shouldSwapOrder ? primary : secondary;

  if (shouldSwapOrder) {
    warnings.push(`Primary provider (${primary.name}) recently unhealthy, trying ${secondary!.name} first`);
  }

  try {
    const output = await retryWithBackoff(first, input);
    return { output, fallbackUsed: !!shouldSwapOrder, warnings };
  } catch (firstErr) {
    const firstMsg = firstErr instanceof Error ? firstErr.message : String(firstErr);
    console.error(`[ai-fallback] ${first.name} failed: ${firstMsg}`);
    warnings.push(`Provider (${first.name}) failed: ${firstMsg}`);

    if (!second) {
      throw new Error(`AI generation failed (${first.name}): ${firstMsg}`);
    }

    try {
      const output = await retryWithBackoff(second, input);
      return { output, fallbackUsed: true, warnings };
    } catch (secondErr) {
      const secondMsg = secondErr instanceof Error ? secondErr.message : String(secondErr);
      console.error(`[ai-fallback] ${second.name} also failed: ${secondMsg}`);
      warnings.push(`Provider (${second.name}) failed: ${secondMsg}`);
      throw new Error(`All AI providers failed. ${first.name}: ${firstMsg}. ${second.name}: ${secondMsg}`);
    }
  }
}

export async function healthCheckAll(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  const primary = getPrimary();
  const isHealthy = await primary.healthCheck();
  results[primary.name] = isHealthy;
  providerHealth[primary.name] = {
    healthy: isHealthy,
    lastCheck: Date.now(),
    consecutiveFailures: isHealthy ? 0 : (providerHealth[primary.name]?.consecutiveFailures ?? 0) + 1,
  };

  const secondary = getSecondary();
  if (secondary) {
    const secHealthy = await secondary.healthCheck();
    results[secondary.name] = secHealthy;
    providerHealth[secondary.name] = {
      healthy: secHealthy,
      lastCheck: Date.now(),
      consecutiveFailures: secHealthy ? 0 : (providerHealth[secondary.name]?.consecutiveFailures ?? 0) + 1,
    };
  }

  return results;
}

export function getProviderHealth(): Record<string, { healthy: boolean; lastCheck: number; consecutiveFailures: number }> {
  return { ...providerHealth };
}
