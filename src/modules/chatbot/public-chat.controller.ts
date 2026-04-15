import { Request, Response } from 'express';
import container from '../../config/ioc.config';
import { TYPES_CHATBOT } from '../../config/ioc.types';
import { ChatbotService } from './chatbot.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/api-response';
import type { PublicChatInput } from './chatbot.validation';

export class PublicChatController {
  constructor(private chatbotService = container.get<ChatbotService>(TYPES_CHATBOT.ChatbotService)) {}

  public bootstrap = asyncHandler(async (req: Request, res: Response) => {
    const publicKey = String(req.params.publicKey);
    const origin = (req.headers.origin as string | undefined) ?? (req.query.origin as string | undefined);
    const data = await this.chatbotService.getPublicBootstrap(publicKey, origin);
    return ok(req, res, data);
  });

  public chat = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as PublicChatInput;
    const data = await this.chatbotService.chatPublic(payload);
    return ok(req, res, data);
  });
}
