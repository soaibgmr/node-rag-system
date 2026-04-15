import { injectable } from 'inversify';
import { EmbeddingService } from './embedding.service';
import appConfig from '../../config/app.config';
import { EmbeddingInput, EmbeddingVector } from './rag.types';
import { ErrorCode, InternalServerError, ServiceUnavailableError } from '../../utils/errors';

interface OllamaEmbeddingsResponse {
  embedding?: number[];
}

@injectable()
export class OllamaEmbeddingService extends EmbeddingService {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    super();
    this.baseUrl = appConfig.rag.ollama.baseUrl.replace(/\/$/, '');
    this.model = appConfig.rag.ollama.embeddingModel;
  }

  async embedTexts(inputs: EmbeddingInput[]): Promise<EmbeddingVector[]> {
    return Promise.all(
      inputs.map(async (input) => {
        const values = await this.embedQuery(input.text);
        return {
          id: input.id,
          values,
          metadata: input.metadata,
        };
      }),
    );
  }

  async embedQuery(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new InternalServerError(`Ollama embedding request failed: ${response.status} ${details}`, ErrorCode.INTERNAL_ERROR);
      }

      const payload = (await response.json()) as OllamaEmbeddingsResponse;
      const vector = payload.embedding;

      if (!vector || !Array.isArray(vector) || vector.length === 0) {
        throw new InternalServerError('Ollama embedding response did not include a valid vector', ErrorCode.INTERNAL_ERROR);
      }

      return vector;
    } catch (error) {
      if (error instanceof InternalServerError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ServiceUnavailableError(`Ollama embedding service is unavailable: ${message}`, ErrorCode.SERVICE_UNAVAILABLE);
    }
  }
}