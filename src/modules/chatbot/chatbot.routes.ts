import { Router } from 'express';
import container from '../../config/ioc.config';
import { TYPES_CHATBOT } from '../../config/ioc.types';
import { ChatbotController } from './chatbot.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  addDomainSchema,
  chatbotIdParamsSchema,
  conversationIdParamsSchema,
  createChatbotSchema,
  createSourceSchema,
  domainIdParamsSchema,
  sourceIdParamsSchema,
  updateChatbotSchema,
} from './chatbot.validation';
import { ingestionRateLimiter } from '../../middleware/rate-limit.middleware';

const router = Router();
const chatbotController = container.get<ChatbotController>(TYPES_CHATBOT.ChatbotController);

router.use(authenticate);

router.post('/', validate({ body: createChatbotSchema }), chatbotController.createChatbot);
router.get('/', chatbotController.listChatbots);
router.get('/:chatbotId', validate({ params: chatbotIdParamsSchema }), chatbotController.getChatbot);
router.patch('/:chatbotId', validate({ params: chatbotIdParamsSchema, body: updateChatbotSchema }), chatbotController.updateChatbot);
router.delete('/:chatbotId', validate({ params: chatbotIdParamsSchema }), chatbotController.archiveChatbot);

router.post('/:chatbotId/domains', validate({ params: chatbotIdParamsSchema, body: addDomainSchema }), chatbotController.addDomain);
router.delete('/:chatbotId/domains/:domainId', validate({ params: domainIdParamsSchema }), chatbotController.removeDomain);

router.post(
  '/:chatbotId/sources',
  ingestionRateLimiter,
  validate({ params: chatbotIdParamsSchema, body: createSourceSchema }),
  chatbotController.createSource
);
router.get('/:chatbotId/sources', validate({ params: chatbotIdParamsSchema }), chatbotController.listSources);
router.delete('/:chatbotId/sources/:sourceId', validate({ params: sourceIdParamsSchema }), chatbotController.removeSource);
router.post(
  '/:chatbotId/sources/:sourceId/ingest',
  ingestionRateLimiter,
  validate({ params: sourceIdParamsSchema }),
  chatbotController.startIngestion
);
router.get('/:chatbotId/jobs', validate({ params: chatbotIdParamsSchema }), chatbotController.listJobs);

router.get('/:chatbotId/conversations', validate({ params: chatbotIdParamsSchema }), chatbotController.listConversations);
router.get('/:chatbotId/conversations/:conversationId/messages', validate({ params: conversationIdParamsSchema }), chatbotController.listMessages);

export default router;
