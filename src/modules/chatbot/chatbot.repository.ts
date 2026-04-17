import { injectable } from 'inversify';
import container from '../../config/ioc.config';
import { TYPES_COMMON } from '../../config/ioc.types';
import { PrismaService } from '../../services/prisma.service';
import { ChatbotStatus, IngestionStatus, MessageRole, Prisma, SourceType } from '../../prisma/generated/prisma/client';

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
    status: ChatbotStatus;
  }) {
    return this.prisma.chatbot.create({
      data,
      include: {
        domains: true,
      },
    });
  }

  listChatbots(input: { ownerId: string; isAdmin: boolean; search?: string }) {
    const normalizedSearch = input.search?.trim();

    const where: Prisma.ChatbotWhereInput = input.isAdmin
      ? {
          isArchived: false,
        }
      : {
          ownerId: input.ownerId,
          isArchived: false,
        };

    if (normalizedSearch) {
      where.OR = [
        {
          name: {
            contains: normalizedSearch,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: normalizedSearch,
            mode: 'insensitive',
          },
        },
      ];
    }

    return this.prisma.chatbot.findMany({
      where,
      include: {
        domains: true,
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findChatbotByRequester(input: { chatbotId: string; ownerId: string; isAdmin: boolean }) {
    const where: Prisma.ChatbotWhereInput = input.isAdmin
      ? {
          id: input.chatbotId,
          isArchived: false,
        }
      : {
          id: input.chatbotId,
          ownerId: input.ownerId,
          isArchived: false,
        };

    return this.prisma.chatbot.findFirst({
      where,
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

  findChatbotByPublicIdentifier(input: { publicKey?: string; chatbotId?: string }) {
    const orFilters: Array<Prisma.ChatbotWhereInput> = [];

    if (input.publicKey) {
      orFilters.push({ publicKey: input.publicKey });
    }

    if (input.chatbotId) {
      // Check if it's a valid UUID before adding to filter
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(input.chatbotId)) {
        orFilters.push({ id: input.chatbotId });
      } else if (!input.publicKey) {
        // If it's not a UUID and no publicKey was provided, we can try to match it against publicKey
        // since some users might pass the publicKey where chatbotId is expected in the "id" route
        orFilters.push({ publicKey: input.chatbotId });
      }
    }

    if (orFilters.length === 0) {
      return null;
    }

    return this.prisma.chatbot.findFirst({
      where: {
        isArchived: false,
        status: ChatbotStatus.PUBLISHED,
        OR: orFilters,
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

  updateChatbot(input: { chatbotId: string; ownerId: string; isAdmin: boolean }, data: Record<string, unknown>) {
    const where: Prisma.ChatbotWhereInput = input.isAdmin
      ? {
          id: input.chatbotId,
          isArchived: false,
        }
      : {
          id: input.chatbotId,
          ownerId: input.ownerId,
          isArchived: false,
        };

    return this.prisma.chatbot.updateMany({
      where,
      data,
    });
  }

  archiveChatbot(input: { chatbotId: string; ownerId: string; isAdmin: boolean }) {
    const where: Prisma.ChatbotWhereInput = input.isAdmin
      ? {
          id: input.chatbotId,
          isArchived: false,
        }
      : {
          id: input.chatbotId,
          ownerId: input.ownerId,
          isArchived: false,
        };

    return this.prisma.chatbot.updateMany({
      where,
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

  findLatestIngestionJobBySource(chatbotId: string, sourceId: string) {
    return this.prisma.ingestionJob.findFirst({
      where: {
        chatbotId,
        sourceId,
      },
      orderBy: {
        createdAt: 'desc',
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

  replaceChunks(data: {
    chatbotId: string;
    sourceId: string;
    chunks: Array<{ chunkIndex: number; content: string; vectorId: string; tokenCount?: number }>;
  }) {
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

  async getChatbotStats(input: { ownerId: string; isAdmin: boolean }) {
    const chatbotWhere: Prisma.ChatbotWhereInput = input.isAdmin
      ? { isArchived: false }
      : { ownerId: input.ownerId, isArchived: false };

    const [totalChatbots, activeChatbots, totalSessions] = await Promise.all([
      this.prisma.chatbot.count({ where: chatbotWhere }),
      this.prisma.chatbot.count({ where: { ...chatbotWhere, status: 'PUBLISHED' } }),
      this.prisma.conversation.count({
        where: {
          chatbot: chatbotWhere,
        },
      }),
    ]);

    // Compute avg response time by pairing USER → ASSISTANT messages per conversation
    const conversations = await this.prisma.conversation.findMany({
      where: { chatbot: chatbotWhere },
      select: { id: true },
    });

    let avgResponseSeconds: number | null = null;

    if (conversations.length > 0) {
      const conversationIds = conversations.map((c) => c.id);

      const messages = await this.prisma.chatMessage.findMany({
        where: {
          conversationId: { in: conversationIds },
          role: { in: ['USER', 'ASSISTANT'] },
        },
        select: { conversationId: true, role: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      // Group messages by conversation
      const byConversation = new Map<string, typeof messages>();
      for (const msg of messages) {
        const list = byConversation.get(msg.conversationId) ?? [];
        list.push(msg);
        byConversation.set(msg.conversationId, list);
      }

      const deltas: number[] = [];
      for (const msgs of byConversation.values()) {
        for (let i = 0; i < msgs.length - 1; i++) {
          if (msgs[i].role === 'USER' && msgs[i + 1].role === 'ASSISTANT') {
            const deltaMs = msgs[i + 1].createdAt.getTime() - msgs[i].createdAt.getTime();
            if (deltaMs >= 0) {
              deltas.push(deltaMs);
            }
          }
        }
      }

      if (deltas.length > 0) {
        const avgMs = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
        avgResponseSeconds = Math.round(avgMs / 1000);
      }
    }

    return {
      totalChatbots,
      totalSessions,
      activeChatbots,
      inactiveChatbots: totalChatbots - activeChatbots,
      avgResponseSeconds,
    };
  }
}
