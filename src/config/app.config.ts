import dotenv from 'dotenv';
import { validateEnv, Env } from './env.schema';

dotenv.config();
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const env = validateEnv();

const appConfig = {
  env,
  jwt: {
    secret: env.JWT_SECRET,
    audience: env.JWT_AUDIENCE,
    issuer: env.JWT_ISSUER,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  environment: {
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
  },
  port: parseInt(env.PORT, 10),
  api: {
    clientId: env.CLIENT_ID,
  },
  app: {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    mode: env.APP_MODE,
    description: env.APP_DESCRIPTION,
    author: env.APP_AUTHOR,
    url: env.APP_URL,
  },
  database: {
    url: env.DATABASE_URL,
  },
  azureStorage: {
    connectionString: env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: env.AZURE_STORAGE_CONTAINER_NAME,
    defaultDomain: env.AZURE_STORAGE_DEFAULT_BASE_URL,
    assignedDomain: env.AZURE_STORAGE_ASSIGNED_BASE_URL,
  },
  email: {
    fromName: env.SMTP_FROM_NAME,
    fromEmail: env.SMTP_FROM_EMAIL,
    replyToName: env.SMTP_REPLY_TO_NAME,
    replyToEmail: env.SMTP_REPLY_TO_EMAIL,
    developerEmail: env.DEVELOPER_EMAIL,
  },
  smtp: {
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    username: env.SMTP_USERNAME,
    password: env.SMTP_PASSWORD,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  rag: {
    pinecone: {
      apiKey: env.PINECONE_API_KEY,
      indexHost: env.PINECONE_INDEX_HOST,
      apiVersion: env.PINECONE_API_VERSION,
      namespacePrefix: env.PINECONE_NAMESPACE_PREFIX,
      textField: env.PINECONE_TEXT_FIELD,
    },
    ollama: {
      baseUrl: env.OLLAMA_BASE_URL,
      embeddingModel: env.OLLAMA_EMBEDDING_MODEL,
    },
    groq: {
      apiKey: env.GROQ_API_KEY,
      baseUrl: env.GROQ_BASE_URL,
      model: env.GROQ_MODEL,
    },
    defaults: {
      topK: parseInt(env.RAG_TOP_K, 10),
      temperature: parseFloat(env.RAG_TEMPERATURE),
      chunkSize: parseInt(env.RAG_CHUNK_SIZE, 10),
      chunkOverlap: parseInt(env.RAG_CHUNK_OVERLAP, 10),
      maxContextItems: parseInt(env.RAG_MAX_CONTEXT_ITEMS, 10),
      maxCompletionTokens: parseInt(env.RAG_MAX_COMPLETION_TOKENS, 10),
    },
    embeddingDimension: parseInt(env.RAG_EMBEDDING_DIMENSION, 10),
    rateLimits: {
      publicChatPer15m: parseInt(env.PUBLIC_CHAT_RATE_LIMIT, 10),
      ingestionPer15m: parseInt(env.INGESTION_RATE_LIMIT, 10),
    },
  },
};

export default appConfig;
