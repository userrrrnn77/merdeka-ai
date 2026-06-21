// src/config/vectordb.ts
// Qdrant dipakai untuk dua fungsi sekaligus (sesuai planning Section 6 & 7):
//   1. RAG knowledge base (knowledge_chunks)
//   2. Semantic cache (semantic_cache)
// Dipisah jadi 2 collection berbeda meskipun satu Qdrant instance,
// supaya TTL/cleanup cache tidak mengganggu data RAG permanen.

import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "./env.js";
import { COHERE_EMBED_DIMENSION } from "./cohere.js";
import { logger } from "../utils/logger.js";

export const qdrantClient = new QdrantClient({
  url: env.QDRANT_URL,
  apiKey: env.QDRANT_API_KEY || undefined,
});

export const QDRANT_COLLECTIONS = {
  KNOWLEDGE: "knowledge_chunks",
  CACHE: "semantic_cache",
} as const;

async function ensureCollection(name: string): Promise<void> {
  const collections = await qdrantClient.getCollections();
  const exists = collections.collections.some((c) => c.name === name);

  if (exists) {
    logger.info(`[Qdrant] Collection "${name}" sudah ada.`);
    return;
  }

  await qdrantClient.createCollection(name, {
    vectors: {
      size: COHERE_EMBED_DIMENSION,
      distance: "Cosine",
    },
  });
  logger.info(`[Qdrant] Collection "${name}" berhasil dibuat.`);
}

export async function initVectorDB(): Promise<void> {
  try {
    await ensureCollection(QDRANT_COLLECTIONS.KNOWLEDGE);
    await ensureCollection(QDRANT_COLLECTIONS.CACHE);
    logger.info("[Qdrant] Semua collection siap.");
  } catch (error) {
    logger.error(
      `[Qdrant] Gagal inisialisasi collection: ${(error as Error).message}`,
    );
    throw error;
  }
}
