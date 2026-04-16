import { Request, Response } from 'express';
import container from '../../config/ioc.config';
import { TYPES_CHATBOT } from '../../config/ioc.types';
import { ChatbotService } from './chatbot.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, noContent, ok } from '../../utils/api-response';
import type { AddDomainInput, CreateChatbotInput, CreateSourceInput, UpdateChatbotInput } from './chatbot.validation';

export class ChatbotController {
  constructor(private chatbotService = container.get<ChatbotService>(TYPES_CHATBOT.ChatbotService)) {}

  public createChatbot = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as CreateChatbotInput;
    const data = await this.chatbotService.createChatbot(req.user!.userId, payload);
    return created(req, res, data, 'Chatbot created');
  });

  public listChatbots = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.chatbotService.listChatbots({
      ownerId: req.user!.userId,
      roles: req.user?.roles ?? [],
    });
    return ok(req, res, data);
  });

  public getChatbotStats = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.chatbotService.getChatbotStats({
      ownerId: req.user!.userId,
      roles: req.user?.roles ?? [],
    });
    return ok(req, res, data);
  });

  public getChatbot = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const data = await this.chatbotService.getChatbot(req.user!.userId, chatbotId, req.user?.roles ?? []);
    return ok(req, res, data);
  });

  public updateChatbot = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const payload = req.body as UpdateChatbotInput;
    const data = await this.chatbotService.updateChatbot(req.user!.userId, chatbotId, payload, req.user?.roles ?? []);
    return ok(req, res, data);
  });

  public archiveChatbot = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const data = await this.chatbotService.archiveChatbot(req.user!.userId, chatbotId, req.user?.roles ?? []);
    return ok(req, res, data);
  });

  public addDomain = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const payload = req.body as AddDomainInput;
    const data = await this.chatbotService.addDomain(req.user!.userId, chatbotId, payload);
    return created(req, res, data, 'Domain added');
  });

  public removeDomain = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const domainId = String(req.params.domainId);
    await this.chatbotService.removeDomain(req.user!.userId, chatbotId, domainId);
    return noContent(req, res);
  });

  public createSource = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const payload = req.body as CreateSourceInput;
    const data = await this.chatbotService.createSource(req.user!.userId, chatbotId, payload);
    return created(req, res, data, 'Source created');
  });

  public listSources = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const data = await this.chatbotService.listSources(req.user!.userId, chatbotId);
    return ok(req, res, data);
  });

  public removeSource = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const sourceId = String(req.params.sourceId);
    await this.chatbotService.removeSource(req.user!.userId, chatbotId, sourceId);
    return noContent(req, res);
  });

  public startIngestion = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const sourceId = String(req.params.sourceId);
    const data = await this.chatbotService.triggerIngestion(req.user!.userId, chatbotId, sourceId);
    return created(req, res, data, 'Ingestion queued');
  });

  public listJobs = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const data = await this.chatbotService.listJobs(req.user!.userId, chatbotId);
    return ok(req, res, data);
  });

  public listConversations = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const data = await this.chatbotService.listConversations(req.user!.userId, chatbotId);
    return ok(req, res, data);
  });

  public listMessages = asyncHandler(async (req: Request, res: Response) => {
    const chatbotId = String(req.params.chatbotId);
    const conversationId = String(req.params.conversationId);
    const data = await this.chatbotService.listConversationMessages(req.user!.userId, chatbotId, conversationId);
    return ok(req, res, data);
  });
}
