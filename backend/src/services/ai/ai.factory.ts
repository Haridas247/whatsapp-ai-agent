import { AIProvider } from './ai.provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OllamaProvider } from './ollama.provider';
import { config } from '../../config/env';

let activeProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (activeProvider) return activeProvider;

  const providerType = (config.AI_PROVIDER || 'gemini').toLowerCase();

  if (providerType === 'ollama') {
    console.log('[AI Factory] Initializing Local Development Provider: Ollama (http://localhost:11434)');
    activeProvider = new OllamaProvider();
  } else {
    console.log('[AI Factory] Initializing Production Provider: Google Gemini API (HTTPS)');
    activeProvider = new GeminiProvider();
  }

  return activeProvider;
}
