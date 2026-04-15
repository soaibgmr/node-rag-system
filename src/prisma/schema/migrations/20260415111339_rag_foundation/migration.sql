-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('TEXT', 'DOCUMENT', 'URL');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateTable
CREATE TABLE "chatbots" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(1000),
    "public_key" VARCHAR(255) NOT NULL,
    "pinecone_ns" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "top_k" INTEGER NOT NULL DEFAULT 4,
    "chunk_size" INTEGER NOT NULL DEFAULT 1000,
    "chunk_overlap" INTEGER NOT NULL DEFAULT 150,
    "max_context_items" INTEGER NOT NULL DEFAULT 6,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "chatbots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_domains" (
    "id" UUID NOT NULL,
    "chatbot_id" UUID NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_sources" (
    "id" UUID NOT NULL,
    "chatbot_id" UUID NOT NULL,
    "type" "SourceType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "text_body" TEXT,
    "url" VARCHAR(2000),
    "file_name" VARCHAR(255),
    "mime_type" VARCHAR(255),
    "source_hash" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "knowledge_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_jobs" (
    "id" UUID NOT NULL,
    "chatbot_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'QUEUED',
    "started_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "failure_reason" TEXT,
    "chunks_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ingestion_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" UUID NOT NULL,
    "chatbot_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "token_count" INTEGER,
    "vector_id" VARCHAR(255) NOT NULL,
    "metadata_ref" VARCHAR(255),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "chatbot_id" UUID NOT NULL,
    "external_id" VARCHAR(255),
    "title" VARCHAR(255),
    "visitor_id" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "citations" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chatbots_public_key_key" ON "chatbots"("public_key");

-- CreateIndex
CREATE UNIQUE INDEX "chatbots_pinecone_ns_key" ON "chatbots"("pinecone_ns");

-- CreateIndex
CREATE INDEX "idx_chatbots_owner_id" ON "chatbots"("owner_id");

-- CreateIndex
CREATE INDEX "idx_chatbot_domains_chatbot_id" ON "chatbot_domains"("chatbot_id");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_domains_chatbot_id_domain_key" ON "chatbot_domains"("chatbot_id", "domain");

-- CreateIndex
CREATE INDEX "idx_knowledge_sources_chatbot_id" ON "knowledge_sources"("chatbot_id");

-- CreateIndex
CREATE INDEX "idx_ingestion_jobs_chatbot_status" ON "ingestion_jobs"("chatbot_id", "status");

-- CreateIndex
CREATE INDEX "idx_ingestion_jobs_source_id" ON "ingestion_jobs"("source_id");

-- CreateIndex
CREATE INDEX "idx_document_chunks_chatbot_id" ON "document_chunks"("chatbot_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_source_id_chunk_index_key" ON "document_chunks"("source_id", "chunk_index");

-- CreateIndex
CREATE INDEX "idx_conversations_chatbot_id" ON "conversations"("chatbot_id");

-- CreateIndex
CREATE INDEX "idx_chat_messages_conversation_created" ON "chat_messages"("conversation_id", "created_at");

-- AddForeignKey
ALTER TABLE "chatbots" ADD CONSTRAINT "chatbots_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_domains" ADD CONSTRAINT "chatbot_domains_chatbot_id_fkey" FOREIGN KEY ("chatbot_id") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_chatbot_id_fkey" FOREIGN KEY ("chatbot_id") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_chatbot_id_fkey" FOREIGN KEY ("chatbot_id") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "knowledge_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_chatbot_id_fkey" FOREIGN KEY ("chatbot_id") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
