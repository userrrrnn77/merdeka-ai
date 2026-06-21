import { CohereClient } from "cohere-ai";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const cohereClient = new CohereClient({
  token: env.COHERE_API_KEY,
});

export const COHERE_CHAT_MODEL = env.COHERE_CHAT_MODEL;
export const COHERE_EMBED_MODEL = env.COHERE_EMBED_MODEL;

// embed-multilingual-v3.0 dimension = 1024
// Kalau ganti model embed, update juga collection config Qdrant di vectordb.ts
export const COHERE_EMBED_DIMENSION = 1024;

export async function pingCohere(): Promise<boolean> {
  try {
    await cohereClient.embed({
      texts: ["healthcheck"],
      model: COHERE_EMBED_MODEL,
      inputType: "search_query",
    });
    logger.info("[Cohere] Koneksi ke Cohere API berhasil divalidasi.");
    return true;
  } catch (error) {
    logger.error(`[Cohere] Healthcheck gagal: ${(error as Error).message}`);
    return false;
  }
}
