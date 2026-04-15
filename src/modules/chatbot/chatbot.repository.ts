import { injectable } from 'inversify';
import container from '../../config/ioc.config';
import { TYPES_COMMON } from '../../config/ioc.types';
import { PrismaService } from '../../services/prisma.service';
import { IngestionStatus, MessageRole, Prisma, SourceType } from '../../prisma/generated/prisma/client';

@injectable()
export class ChatbotRepository {
  constructor(private prisma = container.get<PrismaService>(TYPES_COMMON.PrismaService)) {}

  createChatbot(data: {
    ownerId: string;
    name: string;
    description?: string;
    publicKey: string;
    pineconeNs: string;
    model: string;
    temperature: number;
    topK: number;
    chunkSize: number;
    chunkOverlap: number;
    maxContextItems: number;
  }) {
    return this.prisma.chatbot.create({
      data,
      include: {
        domains: true,
      },
    });
  }

  listChatbots(ownerId: string) {
    return this.prisma.chatbot.findMany({
      where: {
        ownerId,
        isArchived: false,
      },
      include: {
        domains: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findChatbotByOwner(chatbotId: string, ownerId: string) {
    return this.prisma.chatbot.findFirst({
      where: {
        id: chatbotId,
        ownerId,
        isArchived: false,
      },
      include: {
        domains: true,
      },
    });
  }

  findChatbotById(chatbotId: string) {
    return this.prisma.chatbot.findFirst({
      where: {
        id: chatbotId,
        isArchived: false,
      },
      include: {
        domains: {
          where: {
            isActive: true,
          },
        },
      },
    });
  }

  findChatbotByPublicKey(publicKey: string) {
    return this.prisma.chatbot.findFirst({
      where: {
        publicKey,
        isArchived: false,
      },
      include: {
        domains: {
          where: {
            isActive: true,
          },
        },
      },
    });
  }

  updateChatbot(chatbotId: string, ownerId: string, data: Record<string, unknown>) {
    return this.prisma.chatbot.updateMany({
      where: {
        id: chatbotId,
        ownerId,
        isArchived: false,
      },
      data,
    });
  }

  archiveChatbot(chatbotId: string, ownerId: string) {
    return this.prisma.chatbot.updateMany({
      where: {
        id: chatbotId,
        ownerId,
        isArchived: false,
      },
      data: {
        isArchived: true,
      },
    });
  }

  addDomain(chatbotId: string, domain: string) {
    return this.prisma.chatbotDomain.create({
      data: {
        chatbotId,
        domain,
      },
    });
  }

  removeDomain(chatbotId: string, domainId: string) {
    return this.prisma.chatbotDomain.deleteMany({
      where: {
        id: domainId,
        chatbotId,
      },
    });
  }

  createSource(data: {
    chatbotId: string;
    type: SourceType;
    title: string;
    textBody?: string;
    url?: string;
    fileName?: string;
    mimeType?: string;
    sourceHash?: string;
  }) {
    const payload = {
      chatbotId: data.chatbotId,
      type: data.type,
      title: data.title,
      ...(data.textBody !== undefined ? { textBody: data.textBody } : {}),
      ...(data.url !== undefined ? { url: data.url } : {}),
      ...(data.fileName !== undefined ? { fileName: data.fileName } : {}),
      ...(data.mimeType !== undefined ? { mimeType: data.mimeType } : {}),
      ...(data.sourceHash !== undefined ? { sourceHash: data.sourceHash } : {}),
    };

    return this.prisma.knowledgeSource.create({
      data: payload,
    });
  }

  listSources(chatbotId: string) {
    return this.prisma.knowledgeSource.findMany({
      where: {
        chatbotId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findSource(chatbotId: string, sourceId: string) {
    return this.prisma.knowledgeSource.findFirst({
      where: {
        id: sourceId,
        chatbotId,
        isActive: true,
      },
    });
  }

  deactivateSource(sourceId: string) {
    return this.prisma.knowledgeSource.update({
      where: {
        id: sourceId,
      },
      data: {
        isActive: false,
      },
    });
  }

  updateSource(sourceId: string, data: Record<string, unknown>) {
    return this.prisma.knowledgeSource.update({
      where: {
        id: sourceId,
      },
      data,
    });
  }

  createIngestionJob(chatbotId: string, sourceId: string) {
    return this.prisma.ingestionJob.create({
      data: {
        chatbotId,
        sourceId,
        status: IngestionStatus.QUEUED,
      },
    });
  }

  updateIngestionJob(jobId: string, data: Record<string, unknown>) {
    return this.prisma.ingestionJob.update({
      where: {
        id: jobId,
      },
      data,
    });
  }

  listIngestionJobs(chatbotId: string) {
    return this.prisma.ingestionJob.findMany({
      where: {
        chatbotId,
      },
      include: {
        source: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  listChunksBySource(sourceId: string) {
    return this.prisma.documentChunk.findMany({
      where: {
        sourceId,
      },
      orderBy: {
        chunkIndex: 'asc',
      },
    });
  }

  replaceChunks(data: { chatbotId: string; sourceId: string; chunks: Array<{ chunkIndex: number; content: string; vectorId: string; tokenCount?: number }> }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.documentChunk.deleteMany({
        where: {
          sourceId: data.sourceId,
        },
      });

      if (data.chunks.length > 0) {
        await tx.documentChunk.createMany({
          data: data.chunks.map((chunk) => ({
            chatbotId: data.chatbotId,
            sourceId: data.sourceId,
            chunkIndex: chunk.chunkIndex,
            content: chunk.content,
            vectorId: chunk.vectorId,
            tokenCount: chunk.tokenCount,
          })),
        });
      }
    });
  }

  createConversation(chatbotId: string, externalId?: string, visitorId?: string) {
    return this.prisma.conversation.create({
      data: {
        chatbotId,
        ...(externalId !== undefined ? { externalId } : {}),
        ...(visitorId !== undefined ? { visitorId } : {}),
      },
    });
  }

  findConversationById(chatbotId: string, conversationId: string) {
    return this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        chatbotId,
      },
    });
  }

  listConversations(chatbotId: string) {
    return this.prisma.conversation.findMany({
      where: {
        chatbotId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  listMessages(conversationId: string) {
    return this.prisma.chatMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  listRecentMessages(conversationId: string, limit: number) {
    return this.prisma.chatMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  createMessage(data: {
    conversationId: string;
    role: MessageRole;
    content: string;
    citations?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
  }) {
    const payload = {
      conversationId: data.conversationId,
      role: data.role,
      content: data.content,
      ...(data.citations !== undefined ? { citations: data.citations } : {}),
      ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
    };
    return this.prisma.chatMessage.create({
      data: payload,
    });
  }
}
