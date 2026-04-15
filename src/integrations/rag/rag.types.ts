export interface EmbeddingInput {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorRecordInput {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface VectorMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface UpsertVectorsOptions {
  namespace: string;
  vectors: EmbeddingVector[];
  records?: VectorRecordInput[];
}

export interface QueryVectorsOptions {
  namespace: string;
  vector?: number[];
  text?: string;
  topK: number;
  filter?: Record<string, unknown>;
}

export interface DeleteVectorsOptions {
  namespace: string;
  ids?: string[];
  deleteAll?: boolean;
}

export interface ChatCompletionRequest {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatCompletionResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface UrlScrapeResult {
  url: string;
  title?: string;
  text: string;
}

export interface ExtractedDocument {
  text: string;
  title?: string;
}

export interface IEmbeddingService {
  embedTexts(inputs: EmbeddingInput[]): Promise<EmbeddingVector[]>;
  embedQuery(text: string): Promise<number[]>;
}

export interface IVectorStoreService {
  upsertVectors(options: UpsertVectorsOptions): Promise<void>;
  queryVectors(options: QueryVectorsOptions): Promise<VectorMatch[]>;
  deleteVectors(options: DeleteVectorsOptions): Promise<void>;
}

export interface ILlmService {
  chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}

export interface IUrlIngestionService {
  scrape(url: string): Promise<UrlScrapeResult>;
}

export interface IDocumentExtractionService {
  extractTextFromDocument(base64Content: string, mimeType?: string): Promise<ExtractedDocument>;
}
