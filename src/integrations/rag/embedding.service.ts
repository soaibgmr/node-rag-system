import { IEmbeddingService, EmbeddingInput, EmbeddingVector } from './rag.types';

export abstract class EmbeddingService implements IEmbeddingService {
  abstract embedTexts(inputs: EmbeddingInput[]): Promise<EmbeddingVector[]>;
  abstract embedQuery(text: string): Promise<number[]>;
}
