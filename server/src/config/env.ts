import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (one level above server/)
// On Vercel, env vars are injected directly — dotenv is a no-op but harmless
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });
} catch {
  // Ignore if dotenv fails (e.g., serverless environment)
}

interface Config {
  aiProviderPrimary: string;
  aiProviderSecondary: string;
  geminiApiKey: string;
  geminiModel: string;
  openrouterApiKey: string;
  openrouterModel: string;
  englishBibleVersion: string;
  tamilBibleVersion: string;
  port: number;
}

function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    console.warn(`[config] WARNING: Environment variable ${key} is not set`);
    return '';
  }
  return value;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    console.warn(`[config] WARNING: Required environment variable ${key} is missing`);
    return '';
  }
  return value;
}

export const config: Config = {
  aiProviderPrimary: getEnv('AI_PROVIDER_PRIMARY', 'gemini'),
  aiProviderSecondary: getEnv('AI_PROVIDER_SECONDARY', 'openrouter'),
  geminiApiKey: getRequiredEnv('GEMINI_API_KEY'),
  geminiModel: getEnv('GEMINI_MODEL', 'gemini-3.6-flash'),
  openrouterApiKey: getRequiredEnv('OPENROUTER_API_KEY'),
  openrouterModel: getEnv('OPENROUTER_MODEL', 'google/gemma-4-31b-it:free'),
  englishBibleVersion: getEnv('ENGLISH_BIBLE_VERSION', 'BSB'),
  tamilBibleVersion: getEnv('TAMIL_BIBLE_VERSION', 'TBSI'),
  port: parseInt(getEnv('PORT', '3001'), 10),
};
