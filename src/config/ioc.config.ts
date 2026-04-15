import { Container } from 'inversify';
import { TYPES_AUTH, TYPES_HEALTH, TYPES_COUNTRY, TYPES_COMMON, TYPES_INTEGRATIONS, TYPES_CHATBOT, TYPES_RAG_INTEGRATIONS } from './ioc.types';

import { PrismaService } from '../services/prisma.service';

import { AuthRepository } from '../modules/auth/auth.repository';
import { AuthService } from '../modules/auth/auth.service';
import { AuthController } from '../modules/auth/auth.controller';

import { HealthController } from '../modules/health/health.controller';

import { CountryRepository } from '../modules/country/country.repository';
import { CountryService } from '../modules/country/country.service';
import { CountryController } from '../modules/country/country.controller';

import { AzureBlobStorageService } from '../integrations/upload/azure.adapter';
import { UploadService } from '../integrations/upload/upload.service';
import { SmtpEmailService } from '../integrations/notification/smtp.adapter';
import { EmailService } from '../integrations/notification/email.service';
import { StripePaymentService } from '../integrations/payment/stripe.adapter';
import { PaymentService } from '../integrations/payment/payment.service';
import { ChatbotRepository } from '../modules/chatbot/chatbot.repository';
import { ChatbotService } from '../modules/chatbot/chatbot.service';
import { ChatbotController } from '../modules/chatbot/chatbot.controller';
import { PublicChatController } from '../modules/chatbot/public-chat.controller';
import {
  BasicDocumentExtractionService,
  DeterministicEmbeddingService,
  DocumentExtractionService,
  EmbeddingService,
  GroqLlmService,
  LlmService,
  OllamaEmbeddingService,
  PineconeVectorStoreService,
  SimpleUrlIngestionService,
  UrlIngestionService,
  VectorStoreService,
} from '../integrations/rag';
import appConfig from './app.config';

const container = new Container();

container.bind<HealthController>(TYPES_HEALTH.HealthController).to(HealthController);

container.bind<PrismaService>(TYPES_COMMON.PrismaService).to(PrismaService);
container.bind<CountryService>(TYPES_COUNTRY.CountryService).to(CountryService);

container.bind<CountryRepository>(TYPES_COUNTRY.CountryRepository).to(CountryRepository);
container.bind<CountryController>(TYPES_COUNTRY.CountryController).to(CountryController);

container.bind<AuthRepository>(TYPES_AUTH.AuthRepository).to(AuthRepository);
container.bind<AuthService>(TYPES_AUTH.AuthService).to(AuthService);
container.bind<AuthController>(TYPES_AUTH.AuthController).to(AuthController);

container.bind<UploadService>(TYPES_INTEGRATIONS.UploadService).to(AzureBlobStorageService);
container.bind<EmailService>(TYPES_INTEGRATIONS.EmailService).to(SmtpEmailService);
container.bind<PaymentService>(TYPES_INTEGRATIONS.PaymentService).to(StripePaymentService);

container.bind<ChatbotRepository>(TYPES_CHATBOT.ChatbotRepository).to(ChatbotRepository);
container.bind<ChatbotService>(TYPES_CHATBOT.ChatbotService).to(ChatbotService);
container.bind<ChatbotController>(TYPES_CHATBOT.ChatbotController).to(ChatbotController);
container.bind<PublicChatController>(TYPES_CHATBOT.PublicChatController).to(PublicChatController);

container.bind<EmbeddingService>(TYPES_RAG_INTEGRATIONS.EmbeddingService).toDynamicValue(() => {
  if (appConfig.rag.ollama.baseUrl && appConfig.rag.ollama.embeddingModel) {
    return new OllamaEmbeddingService();
  }

  return new DeterministicEmbeddingService();
});
container.bind<VectorStoreService>(TYPES_RAG_INTEGRATIONS.VectorStoreService).to(PineconeVectorStoreService);
container.bind<LlmService>(TYPES_RAG_INTEGRATIONS.LlmService).to(GroqLlmService);
container.bind<UrlIngestionService>(TYPES_RAG_INTEGRATIONS.UrlIngestionService).to(SimpleUrlIngestionService);
container.bind<DocumentExtractionService>(TYPES_RAG_INTEGRATIONS.DocumentExtractionService).to(BasicDocumentExtractionService);

export default container;
