-- Change embedding dimension from 1536 (OpenAI) to 768 (Ollama nomic-embed-text)
ALTER TABLE "Article" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "Article" ADD COLUMN "embedding" vector(768);
