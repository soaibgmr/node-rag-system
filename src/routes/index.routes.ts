import express from 'express';
import healthRouter from '../modules/health/health.routes';
import docsRouter from './docs.routes';
import authRouter from '../modules/auth/auth.routes';
import countryRouter from '../modules/country/country.routes';
import chatbotRouter from '../modules/chatbot/chatbot.routes';
import publicChatRouter from '../modules/chatbot/public-chat.routes';

const routes = express.Router();

routes.use('/health', healthRouter);
routes.use('/docs', docsRouter);
routes.use('/auth', authRouter);
routes.use('/countries', countryRouter);
routes.use('/chatbots', chatbotRouter);
routes.use('/public', publicChatRouter);

export default routes;
