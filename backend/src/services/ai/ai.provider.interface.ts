export interface ConversationHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateReplyParams {
  systemPrompt: string;
  userMessage: string;
  history?: ConversationHistoryMessage[];
  temperature?: number;
}

export interface AIProvider {
  readonly name: 'gemini' | 'ollama';
  embed(text: string): Promise<number[]>;
  generateReply(params: GenerateReplyParams): Promise<string>;
}
