import { AiInput } from '../providers/ai/types';

export interface BuiltPrompt {
  systemPrompt: string;
  userMessage: string;
}

const SYSTEM_PROMPT = `You are a Bible study assistant. You explain Bible verses clearly and respectfully.
Rules:
- ONLY explain from the provided verse text below. Do not quote or reference any verse not provided.
- If the context is insufficient, say so honestly.
- Keep explanations concise and accessible.
- Respond in JSON format: {"explanation": "...", "shortSummary": "..."}`;

export function buildPrompt(input: AiInput): BuiltPrompt {
  const tamilLine = input.tamilVerse
    ? `\nTamil Verse Text: ${input.tamilVerse}`
    : '';

  const userMessage = `Verse Reference: ${input.reference}
Verse Text (English): ${input.verseText}${tamilLine}

Question: ${input.question}
Preferred Language: ${input.language}

Respond with a JSON object containing "explanation" and "shortSummary".`;

  return {
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
  };
}
