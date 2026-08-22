import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingService {
  private readonly ollamaUrl: string;

  constructor(private config: ConfigService) {
    this.ollamaUrl = this.config.get<string>('OLLAMA_URL', 'http://localhost:11434');
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.ollamaUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', input: text }),
    });
    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
    }
    const data = (await response.json()) as { embeddings: number[][] };
    return data.embeddings[0];
  }
}
