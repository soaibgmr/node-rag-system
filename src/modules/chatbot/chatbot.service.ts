import { injectable } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import container from '../../config/ioc.config';
import { TYPES_CHATBOT, TYPES_RAG_INTEGRATIONS } from '../../config/ioc.types';
import { ChatbotRepository } from './chatbot.repository';
import { ChatbotStatus, MessageRole, SourceType, IngestionStatus } from '../../prisma/generated/prisma/client';
import { BadRequestError, ConflictError, ErrorCode, ForbiddenError, InternalServerError, NotFoundError } from '../../utils/errors';
import appConfig from '../../config/app.config';
import { LlmService, VectorStoreService, UrlIngestionService, DocumentExtractionService, VectorMatch } from '../../integrations/rag';
import { splitIntoChunks } from '../../utils/rag/chunking';
import { buildSystemPrompt, buildUserPrompt, ConversationTurn, RetrievedContextItem } from '../../utils/rag/prompt';
import type {
  AddChatbotDomainDto,
  CreateChatbotDto,
  CreateKnowledgeSourceDto,
  PublicChatRequestDto,
  PublicChatResponseDto,
  SourceTrainingDataDto,
  UpdateChatbotDto,
} from './chatbot.types';

interface RequestAccessInput {
  ownerId: string;
  roles: string[];
}

@injectable()
export class ChatbotService {
  constructor(
    private chatbotRepository = container.get<ChatbotRepository>(TYPES_CHATBOT.ChatbotRepository),
    private vectorStoreService = container.get<VectorStoreService>(TYPES_RAG_INTEGRATIONS.VectorStoreService),
    private llmService = container.get<LlmService>(TYPES_RAG_INTEGRATIONS.LlmService),
    private urlIngestionService = container.get<UrlIngestionService>(TYPES_RAG_INTEGRATIONS.UrlIngestionService),
    private documentExtractionService = container.get<DocumentExtractionService>(TYPES_RAG_INTEGRATIONS.DocumentExtractionService)
  ) {}

  async createChatbot(ownerId: string, dto: CreateChatbotDto) {
    const publicKey = this.buildPublicKey();
    const pineconeNs = this.buildNamespace();

    return this.chatbotRepository.createChatbot({
      ownerId,
      name: dto.name,
      description: dto.description,
      publicKey,
      pineconeNs,
      model: dto.model ?? appConfig.rag.groq.model,
      temperature: dto.temperature ?? appConfig.rag.defaults.temperature,
      topK: dto.topK ?? appConfig.rag.defaults.topK,
      chunkSize: dto.chunkSize ?? appConfig.rag.defaults.chunkSize,
      chunkOverlap: dto.chunkOverlap ?? appConfig.rag.defaults.chunkOverlap,
      maxContextItems: dto.maxContextItems ?? appConfig.rag.defaults.maxContextItems,
      status: dto.status === 'PUBLISHED' ? ChatbotStatus.PUBLISHED : ChatbotStatus.DRAFT,
    });
  }

  async listChatbots(input: RequestAccessInput) {
    const isAdmin = input.roles.includes('ADMIN');

    return this.chatbotRepository.listChatbots({
      ownerId: input.ownerId,
      isAdmin,
    });
  }

  async getChatbotStats(input: RequestAccessInput) {
    const isAdmin = input.roles.includes('ADMIN');

    return this.chatbotRepository.getChatbotStats({
      ownerId: input.ownerId,
      isAdmin,
    });
  }

  async getChatbot(ownerId: string, chatbotId: string, roles: string[] = []) {
    const chatbot = await this.chatbotRepository.findChatbotByRequester({
      chatbotId,
      ownerId,
      isAdmin: this.isAdmin(roles),
    });

    if (!chatbot) {
      throw new NotFoundError('Chatbot not found', ErrorCode.RESOURCE_NOT_FOUND);
    }

    return chatbot;
  }

  async updateChatbot(ownerId: string, chatbotId: string, dto: UpdateChatbotDto, roles: string[] = []) {
    const isAdmin = this.isAdmin(roles);
    await this.getChatbot(ownerId, chatbotId, roles);

    await this.chatbotRepository.updateChatbot(
      {
        chatbotId,
        ownerId,
        isAdmin,
      },
      {
        ...dto,
      }
    );

    return this.getChatbot(ownerId, chatbotId, roles);
  }

  async archiveChatbot(ownerId: string, chatbotId: string, roles: string[] = []) {
    const isAdmin = this.isAdmin(roles);
    await this.getChatbot(ownerId, chatbotId, roles);

    await this.chatbotRepository.archiveChatbot({
      chatbotId,
      ownerId,
      isAdmin,
    });

    return { chatbotId, archived: true };
  }

  async addDomain(ownerId: string, chatbotId: string, dto: AddChatbotDomainDto) {
    await this.getChatbot(ownerId, chatbotId);

    try {
      const parsedDomain = this.normalizeDomain(dto.domain);
      return await this.chatbotRepository.addDomain(chatbotId, parsedDomain);
    } catch (error) {
      if (error instanceof ConflictError || error instanceof BadRequestError) {
        throw error;
      }
      throw new ConflictError('Domain already exists for chatbot', ErrorCode.RECORD_CONFLICT);
    }
  }

  async removeDomain(ownerId: string, chatbotId: string, domainId: string) {
    await this.getChatbot(ownerId, chatbotId);

    const result = await this.chatbotRepository.removeDomain(chatbotId, domainId);
    if (result.count === 0) {
      throw new NotFoundError('Domain not found', ErrorCode.RESOURCE_NOT_FOUND);
    }

    return {
      domainId,
      removed: true,
    };
  }

  async createSource(ownerId: string, chatbotId: string, dto: CreateKnowledgeSourceDto) {
    const chatbot = await this.getChatbot(ownerId, chatbotId);

    if (dto.type === 'URL' && !dto.url) {
      throw new BadRequestError('url is required for URL source', ErrorCode.INVALID_INPUT);
    }

    if (dto.type === 'TEXT' && !dto.textBody) {
      throw new BadRequestError('textBody is required for TEXT source', ErrorCode.INVALID_INPUT);
    }

    if (dto.type === 'DOCUMENT' && !dto.base64Content) {
      throw new BadRequestError('base64Content is required for DOCUMENT source', ErrorCode.INVALID_INPUT);
    }

    const source = await this.chatbotRepository.createSource({
      chatbotId: chatbot.id,
      type: dto.type as SourceType,
      title: dto.title,
      textBody: dto.type === 'DOCUMENT' ? dto.base64Content : dto.textBody,
      url: dto.url,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
    });

    return source;
  }

  async triggerIngestion(ownerId: string, chatbotId: string, sourceId: string) {
    const chatbot = await this.getChatbot(ownerId, chatbotId);
    const source = await this.chatbotRepository.findSource(chatbot.id, sourceId);

    if (!source) {
      throw new NotFoundError('Source not found', ErrorCode.RESOURCE_NOT_FOUND);
    }

    const job = await this.chatbotRepository.createIngestionJob(chatbot.id, source.id);

    // Process asynchronously without blocking HTTP response.
    void this.processIngestionJob(chatbot.id, source.id, job.id).catch(() => undefined);

    return job;
  }

  async listSources(ownerId: string, chatbotId: string) {
    await this.getChatbot(ownerId, chatbotId);
    return this.chatbotRepository.listSources(chatbotId);
  }

  async getSourceTrainingData(ownerId: string, chatbotId: string, sourceId: string): Promise<SourceTrainingDataDto> {
    await this.getChatbot(ownerId, chatbotId);

    const source = await this.chatbotRepository.findSource(chatbotId, sourceId);
    if (!source) {
      throw new NotFoundError('Source not found', ErrorCode.RESOURCE_NOT_FOUND);
    }

    const [latestJob, chunks] = await Promise.all([
      this.chatbotRepository.findLatestIngestionJobBySource(chatbotId, sourceId),
      this.chatbotRepository.listChunksBySource(sourceId),
    ]);

    return {
      source: {
        id: source.id,
        chatbotId: source.chatbotId,
        type: source.type,
        title: source.title,
        url: source.url,
        fileName: source.fileName,
        mimeType: source.mimeType,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
      },
      extractedText: source.textBody ?? undefined,
      latestJob: latestJob
        ? {
            id: latestJob.id,
            status: latestJob.status,
            failureReason: latestJob.failureReason,
            chunksCount: latestJob.chunksCount,
            createdAt: latestJob.createdAt,
            updatedAt: latestJob.updatedAt,
            completedAt: latestJob.completedAt,
          }
        : undefined,
      chunks: chunks.map((chunk) => ({
        id: chunk.id,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        tokenCount: chunk.tokenCount,
        createdAt: chunk.createdAt,
      })),
    };
  }

  async removeSource(ownerId: string, chatbotId: string, sourceId: string) {
    const chatbot = await this.getChatbot(ownerId, chatbotId);
    const source = await this.chatbotRepository.findSource(chatbot.id, sourceId);

    if (!source) {
      throw new NotFoundError('Source not found', ErrorCode.RESOURCE_NOT_FOUND);
    }

    const existingChunks = await this.chatbotRepository.listChunksBySource(source.id);
    if (existingChunks.length > 0) {
      await this.vectorStoreService.deleteVectors({
        namespace: chatbot.pineconeNs,
        ids: existingChunks.map((item) => item.vectorId),
      });
    }

    await this.chatbotRepository.deactivateSource(source.id);

    return {
      sourceId: source.id,
      removed: true,
    };
  }

  async listJobs(ownerId: string, chatbotId: string) {
    await this.getChatbot(ownerId, chatbotId);
    return this.chatbotRepository.listIngestionJobs(chatbotId);
  }

  async listConversations(ownerId: string, chatbotId: string) {
    await this.getChatbot(ownerId, chatbotId);
    return this.chatbotRepository.listConversations(chatbotId);
  }

  async listConversationMessages(ownerId: string, chatbotId: string, conversationId: string) {
    await this.getChatbot(ownerId, chatbotId);

    const conversation = await this.chatbotRepository.findConversationById(chatbotId, conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found', ErrorCode.RESOURCE_NOT_FOUND);
    }

    return this.chatbotRepository.listMessages(conversation.id);
  }

  async getPublicBootstrap(identifier: { publicKey?: string; chatbotId?: string }, origin?: string) {
    const chatbot = await this.resolvePublicChatbot(identifier);

    this.validateAllowedOrigin(
      chatbot.domains.map((d) => d.domain),
      origin
    );

    return {
      chatbotId: chatbot.id,
      name: chatbot.name,
      description: chatbot.description,
      model: chatbot.model,
      hasDomainRestrictions: chatbot.domains.length > 0,
    };
  }

  async chatPublic(dto: PublicChatRequestDto): Promise<PublicChatResponseDto> {
    const chatbot = await this.resolvePublicChatbot({
      publicKey: dto.publicKey,
      chatbotId: dto.chatbotId,
    });

    this.validateAllowedOrigin(
      chatbot.domains.map((d) => d.domain),
      dto.origin
    );

    let conversation = dto.conversationId ? await this.chatbotRepository.findConversationById(chatbot.id, dto.conversationId) : null;

    if (!conversation) {
      conversation = await this.chatbotRepository.createConversation(chatbot.id, undefined, dto.visitorId);
    }

    await this.chatbotRepository.createMessage({
      conversationId: conversation.id,
      role: MessageRole.USER,
      content: dto.message,
    });

    const matches = await this.vectorStoreService.queryVectors({
      namespace: chatbot.pineconeNs,
      text: dto.message,
      topK: chatbot.topK,
    });

    const recentMessages = await this.chatbotRepository.listRecentMessages(conversation.id, 8);
    const history = recentMessages.reverse().map(
      (message): ConversationTurn => ({
        role: message.role,
        content: message.content,
      })
    );

    const contextItems = this.toContextItems(matches, chatbot.maxContextItems);
    const userPrompt = buildUserPrompt(dto.message, contextItems, history);

    const response = await this.llmService.chatCompletion({
      model: chatbot.model,
      systemPrompt: buildSystemPrompt(),
      userPrompt,
      maxTokens: appConfig.rag.defaults.maxCompletionTokens,
      temperature: chatbot.temperature,
    });

    const sources = contextItems.map((item) => ({
      chunkId: item.chunkId,
      sourceId: item.sourceId,
      sourceTitle: item.sourceTitle,
      score: item.score,
    }));

    await this.chatbotRepository.createMessage({
      conversationId: conversation.id,
      role: MessageRole.ASSISTANT,
      content: response.content,
      citations: sources,
      metadata: response.usage,
    });

    return {
      chatbotId: chatbot.id,
      conversationId: conversation.id,
      answer: response.content,
      sources,
    };
  }

  private async processIngestionJob(chatbotId: string, sourceId: string, jobId: string): Promise<void> {
    await this.chatbotRepository.updateIngestionJob(jobId, {
      status: IngestionStatus.PROCESSING,
      startedAt: new Date(),
      failureReason: null,
    });

    try {
      const chatbot = await this.chatbotRepository.findChatbotById(chatbotId);
      if (!chatbot) {
        throw new NotFoundError('Chatbot not found for ingestion', ErrorCode.RESOURCE_NOT_FOUND);
      }

      const source = await this.chatbotRepository.findSource(chatbotId, sourceId);

      if (!source) {
        throw new NotFoundError('Source not found for ingestion', ErrorCode.RESOURCE_NOT_FOUND);
      }

      const resolvedText = await this.resolveSourceText(source.type, source.textBody, source.url, source.mimeType, source.title);

      await this.chatbotRepository.updateSource(source.id, {
        textBody: resolvedText,
      });

      const chunks = splitIntoChunks(resolvedText, {
        chunkSize: chatbot.chunkSize,
        chunkOverlap: chatbot.chunkOverlap,
      });

      if (chunks.length === 0) {
        throw new BadRequestError('No chunkable content found', ErrorCode.INVALID_INPUT);
      }

      const records = chunks.map((content, idx) => ({
        id: uuidv4(),
        text: content,
        metadata: {
          chunkId: `${source.id}_${idx}`,
          sourceId: source.id,
          sourceTitle: source.title,
          sourceType: source.type,
          chunkIndex: idx,
          content,
        },
      }));

      const existingChunks = await this.chatbotRepository.listChunksBySource(source.id);
      if (existingChunks.length > 0) {
        await this.vectorStoreService.deleteVectors({
          namespace: chatbot.pineconeNs,
          ids: existingChunks.map((item) => item.vectorId),
        });
      }

      await this.vectorStoreService.upsertVectors({
        namespace: chatbot.pineconeNs,
        vectors: [],
        records,
      });

      await this.chatbotRepository.replaceChunks({
        chatbotId,
        sourceId: source.id,
        chunks: chunks.map((content, idx) => ({
          chunkIndex: idx,
          content,
          vectorId: records[idx].id,
          tokenCount: Math.ceil(content.length / 4),
        })),
      });

      await this.chatbotRepository.updateIngestionJob(jobId, {
        status: IngestionStatus.COMPLETED,
        completedAt: new Date(),
        chunksCount: chunks.length,
      });
    } catch (error) {
      await this.chatbotRepository.updateIngestionJob(jobId, {
        status: IngestionStatus.FAILED,
        completedAt: new Date(),
        failureReason: error instanceof Error ? error.message : 'Unknown ingestion error',
      });
    }
  }

  private async resolveSourceText(
    sourceType: SourceType,
    textBody: string | null,
    url: string | null,
    mimeType: string | null,
    title: string
  ): Promise<string> {
    if (sourceType === SourceType.TEXT) {
      return textBody?.trim() || '';
    }

    if (sourceType === SourceType.URL) {
      if (!url) {
        throw new BadRequestError('URL source is missing url field', ErrorCode.INVALID_INPUT);
      }

      const scraped = await this.urlIngestionService.scrape(url);
      return scraped.text;
    }

    if (sourceType === SourceType.DOCUMENT) {
      if (!textBody) {
        throw new BadRequestError('Document source has no payload to extract', ErrorCode.INVALID_INPUT);
      }

      const extracted = await this.documentExtractionService.extractTextFromDocument(textBody, mimeType ?? undefined);
      return extracted.text;
    }

    throw new InternalServerError(`Unsupported source type for ${title}`, ErrorCode.INTERNAL_ERROR);
  }

  private normalizeDomain(domain: string): string {
    const clean = domain.trim().toLowerCase();

    // If it's just an IP or hostname without protocol, return it
    if (!clean.includes('://')) {
      return clean;
    }

    try {
      const url = new URL(clean);
      const host = url.host; // includes port if present
      if (!host || host.length < 3) {
        return clean;
      }
      return host;
    } catch {
      return clean;
    }
  }

  private validateAllowedOrigin(allowedDomains: string[], origin?: string): void {
    if (allowedDomains.length === 0) {
      return;
    }

    if (!origin) {
      throw new ForbiddenError('Origin is required for this chatbot', ErrorCode.FORBIDDEN);
    }

    console.log(`[CORS DEBUG] Validating origin: ${origin} against domains: ${allowedDomains.join(', ')}`);

    const host = this.normalizeDomain(origin);
    console.log(`[CORS DEBUG] Normalized host: ${host}`);

    const match = allowedDomains.some((domain) => {
      const allowed = domain.toLowerCase().trim();
      return host === allowed || host.endsWith(`.${allowed}`) || (host.includes(':') && host.split(':')[0] === allowed);
    });

    if (!match) {
      console.error(`[CORS DEBUG] Validation failed for host: ${host}`);
      throw new ForbiddenError('Origin is not allowed for this chatbot', ErrorCode.FORBIDDEN);
    }
    console.log(`[CORS DEBUG] Validation successful for host: ${host}`);
  }

  private async resolvePublicChatbot(identifier: { publicKey?: string; chatbotId?: string }) {
    const chatbot = await this.chatbotRepository.findChatbotByPublicIdentifier(identifier);

    if (!chatbot) {
      throw new NotFoundError('Chatbot not found', ErrorCode.RESOURCE_NOT_FOUND);
    }

    if (chatbot.status !== ChatbotStatus.PUBLISHED) {
      throw new ForbiddenError('Chatbot is in draft mode', ErrorCode.FORBIDDEN);
    }

    return chatbot;
  }

  private toContextItems(matches: VectorMatch[], limit: number): Array<RetrievedContextItem & { chunkId: string; sourceId: string }> {
    return matches.slice(0, limit).map((match) => {
      const metadata = (match.metadata ?? {}) as Record<string, unknown>;

      return {
        chunkId: String(metadata.chunkId ?? match.id),
        sourceId: String(metadata.sourceId ?? ''),
        sourceTitle: String(metadata.sourceTitle ?? 'Untitled source'),
        sourceType: String(metadata.sourceType ?? 'UNKNOWN'),
        content: String(metadata.content ?? ''),
        score: match.score,
      };
    });
  }

  private isAdmin(roles: string[]): boolean {
    return roles.includes('ADMIN');
  }

  private buildPublicKey(): string {
    return `bot_${uuidv4().replace(/-/g, '')}`;
  }

  private buildNamespace(): string {
    return `${appConfig.rag.pinecone.namespacePrefix}_${uuidv4().replace(/-/g, '')}`;
  }
}
