export interface AiInput {
  verseText: string;
  reference: string;
  question: string;
  language: string;
  tamilVerse?: string;
  /**
   * If set, replaces the default "explain a single verse" system prompt.
   * Use this for tasks like ask/search/daily that aren't grounded in a
   * specific verse — otherwise the model refuses with "I only explain
   * verses, I cannot answer that".
   */
  systemPromptOverride?: string;
  /**
   * If set, replaces the constructed user message entirely. Pair with
   * systemPromptOverride when calling for non-explain tasks.
   */
  userMessageOverride?: string;
}

export interface AiOutput {
  explanation: string;
  shortSummary: string;
  provider: string;
}

export interface AiProvider {
  generateExplanation(input: AiInput): Promise<AiOutput>;
  healthCheck(): Promise<boolean>;
  readonly name: string;
}
