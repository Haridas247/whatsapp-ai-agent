import axios from 'axios';
import { AIProvider, GenerateReplyParams } from './ai.provider.interface';
import { config } from '../../config/env';

export class OllamaProvider implements AIProvider {
  public readonly name = 'ollama' as const;
  private baseUrl: string;
  private embeddingModel: string;
  private chatModel: string;

  constructor() {
    this.baseUrl = (config.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
    this.embeddingModel = config.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
    this.chatModel = config.OLLAMA_MODEL || 'gemma2:2b';
  }

  public async embed(text: string): Promise<number[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/embeddings`, {
        model: this.embeddingModel,
        prompt: text,
      });

      if (response.data && Array.isArray(response.data.embedding)) {
        return response.data.embedding;
      }
      throw new Error(`Unexpected embedding response format from Ollama: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      throw new Error(`Ollama embed error (${this.baseUrl}): ${error.message}`);
    }
  }

  public async generateReply(params: GenerateReplyParams): Promise<string> {
    try {
      const messages = [
        { role: 'system', content: params.systemPrompt },
        ...(params.history || []).map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: params.userMessage },
      ];

      const response = await axios.post(`${this.baseUrl}/api/chat`, {
        model: this.chatModel,
        messages: messages,
        stream: false,
        options: {
          temperature: params.temperature ?? 0.2,
        },
      });

      const reply = response.data?.message?.content?.trim();
      if (reply) {
        return reply;
      }
      throw new Error('No content returned from Ollama chat response');
    } catch (error: any) {
      throw new Error(`Ollama generateReply error (${this.baseUrl}): ${error.message}`);
    }
  }
}
