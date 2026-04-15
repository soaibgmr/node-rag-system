import { injectable } from 'inversify';
import { EmbeddingService } from './embedding.service';
import { EmbeddingInput, EmbeddingVector } from './rag.types';
import appConfig from '../../config/app.config';

@injectable()
export class DeterministicEmbeddingService extends EmbeddingService {
  private readonly dimensions: number;

  constructor() {
    super();
    this.dimensions = appConfig.rag.embeddingDimension;
  }

  async embedTexts(inputs: EmbeddingInput[]): Promise<EmbeddingVector[]> {
    return inputs.map((input) => ({
      id: input.id,
      values: this.makeVector(input.text),
      metadata: input.metadata,
    }));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.makeVector(text);
  }

  private makeVector(text: string): number[] {
    const output = new Array(this.dimensions).fill(0);
    const normalized = text.toLowerCase().trim();

    for (let i = 0; i < normalized.length; i += 1) {
      const charCode = normalized.charCodeAt(i);
      const idx = i % this.dimensions;
      output[idx] += (charCode % 31) / 31;
    }

    const norm = Math.sqrt(output.reduce((sum, value) => sum + value * value, 0));
    if (norm === 0) {
      return output;
    }

    return output.map((value) => Number((value / norm).toFixed(6)));
  }
}
