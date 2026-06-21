// src/modules/cache/embed.ts
// FIX: tambah parameter inputType ke embedText & embedTexts.
// Cohere embedding butuh inputType yang beda untuk query vs dokumen:
//   - "search_query"   : untuk embed query user (semantic cache lookup, RAG search)
//   - "search_document": untuk embed konten knowledge base (saat seeding)
// Tanpa ini, embedding quality turun karena model tidak tahu konteks pemakaian.

import { cohereClient, COHERE_EMBED_MODEL } from "../../config/cohere.js";
import { logger } from "../../utils/logger.js";

type EmbedInputType =
  | "search_query"
  | "search_document"
  | "classification"
  | "clustering";

/**
 * Embed satu teks jadi vector. Dipakai di semantic cache lookup & RAG search.
 * @param text    - teks yang mau di-embed
 * @param inputType - konteks pemakaian embedding (default: "search_query")
 */
export async function embedText(
  text: string,
  inputType: EmbedInputType = "search_query",
): Promise<number[]> {
  const response = await cohereClient.embed({
    texts: [text],
    model: COHERE_EMBED_MODEL,
    inputType,
  });

  const embedding = response.embeddings;

  if (!Array.isArray(embedding) || !embedding[0]) {
    throw new Error(
      "[Embed] Response embedding kosong atau format tidak valid",
    );
  }

  return embedding[0] as number[];
}

/**
 * Embed banyak teks sekaligus (batch). Dipakai saat seeding knowledge base.
 * Lebih efisien daripada loop embedText() satu-satu karena satu API call.
 * @param texts     - array teks yang mau di-embed
 * @param inputType - konteks pemakaian (default: "search_document" untuk seeding)
 */
export async function embedTexts(
  texts: string[],
  inputType: EmbedInputType = "search_document",
): Promise<number[][]> {
  if (texts.length === 0) return [];

  // Cohere punya batas 96 teks per request — chunk kalau lebih
  const BATCH_SIZE = 96;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await cohereClient.embed({
      texts: batch,
      model: COHERE_EMBED_MODEL,
      inputType,
    });

    const embeddings = response.embeddings;

    if (!Array.isArray(embeddings) || embeddings.length !== batch.length) {
      throw new Error(
        `[Embed] Response batch embedding tidak valid (expected ${batch.length}, got ${Array.isArray(embeddings) ? embeddings.length : "non-array"})`,
      );
    }

    results.push(...(embeddings as number[][]));

    if (texts.length > BATCH_SIZE) {
      logger.info(
        `[Embed] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} selesai`,
      );
    }
  }

  return results;
}
