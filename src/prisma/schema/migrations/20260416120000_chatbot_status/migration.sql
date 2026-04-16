-- CreateEnum
CREATE TYPE "ChatbotStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AddColumn
ALTER TABLE "chatbots" ADD COLUMN "status" "ChatbotStatus";

-- Backfill existing records so currently active chatbots remain usable
UPDATE "chatbots" SET "status" = 'PUBLISHED' WHERE "status" IS NULL;

-- Enforce non-null and default for new records
ALTER TABLE "chatbots" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "chatbots" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
