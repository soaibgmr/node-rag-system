import { Router } from 'express';
import container from '../../config/ioc.config';
import { TYPES_CHATBOT } from '../../config/ioc.types';
import { PublicChatController } from './public-chat.controller';
import { validate } from '../../middleware/validate.middleware';
import { publicChatSchema } from './chatbot.validation';
import { publicChatRateLimiter } from '../../middleware/rate-limit.middleware';

const router = Router();
const publicChatController = container.get<PublicChatController>(TYPES_CHATBOT.PublicChatController);

router.get('/chatbots/:publicKey/bootstrap', publicChatRateLimiter, publicChatController.bootstrap);
router.post('/chat', publicChatRateLimiter, validate({ body: publicChatSchema }), publicChatController.chat);

export default router;
