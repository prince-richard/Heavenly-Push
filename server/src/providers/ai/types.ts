export interface AiInput {
  verseText: string;
  reference: string;
  question: string;
  language: string;
  tamilVerse?: string;
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
