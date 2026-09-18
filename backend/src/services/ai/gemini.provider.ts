import { GoogleGenAI } from '@google/genai';
import { AIProvider, GenerateReplyParams } from './ai.provider.interface';
import { config } from '../../config/env';

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini' as const;
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: config.GEMINI_API_KEY,
    });
  }

  public async embed(text: string): Promise<number[]> {
    if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY.trim().length === 0) {
      throw new Error('Valid Google AI Studio Gemini API Key is required for GeminiProvider.');
    }

    const response = await this.ai.models.embedContent({
      model: config.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
      contents: text,
      config: {
        outputDimensionality: 768,
      },
    });

    const values = response?.embeddings?.[0]?.values || (response as any)?.embedding?.values;
    if (values && Array.isArray(values)) {
      return values;
    }
    throw new Error('No embedding vector values returned from Gemini API.');
  }

  public async generateReply(params: GenerateReplyParams): Promise<string> {
    if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY.trim().length === 0) {
      throw new Error('Valid Google AI Studio Gemini API Key is required for GeminiProvider.');
    }

    const historyParts = (params.history || []).slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const contents = [
      ...historyParts,
      { role: 'user', parts: [{ text: params.userMessage }] },
    ];

    const response = await this.ai.models.generateContent({
      model: config.GEMINI_MODEL || 'gemini-2.5-flash',
      config: {
        systemInstruction: params.systemPrompt,
        temperature: params.temperature ?? 0.2,
      },
      contents: contents,
    });

    return response.text?.trim() || '';
  }
}
