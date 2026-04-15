export const TYPES_HEALTH = {
  HealthController: Symbol.for('HealthController'),
};

export const TYPES_COMMON = {
  PrismaService: Symbol.for('PrismaService'),
};

export const TYPES_COUNTRY = {
  CountryRepository: Symbol.for('CountryRepository'),
  CountryService: Symbol.for('CountryService'),
  CountryController: Symbol.for('CountryController'),
};

export const TYPES_AUTH = {
  AuthRepository: Symbol.for('AuthRepository'),
  AuthService: Symbol.for('AuthService'),
  AuthController: Symbol.for('AuthController'),
};

export const TYPES_INTEGRATIONS = {
  UploadService: Symbol.for('UploadService'),
  EmailService: Symbol.for('EmailService'),
  PaymentService: Symbol.for('PaymentService'),
};

export const TYPES_CHATBOT = {
  ChatbotRepository: Symbol.for('ChatbotRepository'),
  ChatbotService: Symbol.for('ChatbotService'),
  ChatbotController: Symbol.for('ChatbotController'),
  PublicChatController: Symbol.for('PublicChatController'),
};

export const TYPES_RAG_INTEGRATIONS = {
  EmbeddingService: Symbol.for('EmbeddingService'),
  VectorStoreService: Symbol.for('VectorStoreService'),
  LlmService: Symbol.for('LlmService'),
  UrlIngestionService: Symbol.for('UrlIngestionService'),
  DocumentExtractionService: Symbol.for('DocumentExtractionService'),
};
