export type ChatbotStatusDto = 'DRAFT' | 'PUBLISHED';

export interface CreateChatbotDto {
  name: string;
  description?: string;
  model?: string;
  temperature?: number;
  topK?: number;
  chunkSize?: number;
  chunkOverlap?: number;
  maxContextItems?: number;
  status?: ChatbotStatusDto;
}

export interface UpdateChatbotDto {
  name?: string;
  description?: string;
  model?: string;
  temperature?: number;
  topK?: number;
  chunkSize?: number;
  chunkOverlap?: number;
  maxContextItems?: number;
  status?: ChatbotStatusDto;
}

export interface AddChatbotDomainDto {
  domain: string;
}

export type SourceTypeDto = 'TEXT' | 'DOCUMENT' | 'URL';

export interface CreateKnowledgeSourceDto {
  type: SourceTypeDto;
  title: string;
  textBody?: string;
  url?: string;
  mimeType?: string;
  fileName?: string;
  base64Content?: string;
}

export interface TriggerIngestionDto {
  sourceId: string;
}

export interface SourceTrainingChunkDto {
  id: string;
  chunkIndex: number;
  content: string;
  tokenCount?: number | null;
  createdAt?: Date;
}

export interface SourceTrainingDataDto {
  source: {
    id: string;
    chatbotId: string;
    type: SourceTypeDto;
    title: string;
    url?: string | null;
    fileName?: string | null;
    mimeType?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  };
  extractedText?: string;
  latestJob?: {
    id: string;
    status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
    failureReason?: string | null;
    chunksCount: number;
    createdAt?: Date;
    updatedAt?: Date;
    completedAt?: Date | null;
  };
  chunks: SourceTrainingChunkDto[];
}

export interface ChatbotStatsDto {
  totalChatbots: number;
  totalSessions: number;
  activeChatbots: number;
  inactiveChatbots: number;
  avgResponseSeconds: number | null;
}

export interface PublicChatRequestDto {
  publicKey?: string;
  chatbotId?: string;
  message: string;
  conversationId?: string;
  origin?: string;
  visitorId?: string;
}

export interface PublicChatResponseDto {
  chatbotId: string;
  conversationId: string;
  answer: string;
  sources: Array<{
    chunkId: string;
    sourceId: string;
    sourceTitle: string;
    score: number;
  }>;
}
