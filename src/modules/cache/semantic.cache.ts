// src/modules/cache/semantic.cache.ts
// Section 6 planning: semantic caching berbasis kemiripan makna.
// ATURAN CACHE ISOLATION WAJIB: cache HANYA untuk response non-personal.
// Cache key include jenjang user karena pertanyaan sama bisa butuh
// jawaban berbeda kedalamannya (Section 6 — catatan implementasi).

import { qdrantClient, QDRANT_COLLECTIONS } from "../../config/vectordb.js";
import { embedText } from "./embed.js";
import { CachedResponse } from "../../models/cachedResponse.model.js";
import type {
  PipelineContext,
  SemanticCacheResult,
} from "../../types/pipeline.types.js";
import { logger } from "../../utils/logger.js";

const CACHE_SIMILARITY_THRESHOLD = 0.92;

/**
 * Cek apakah response untuk context ini boleh dicache.
 * Sesuai Section 6: response dengan konteks personal (learning history,
 * profil user, follow-up message) WAJIB skip cache lookup & store.
 */
export function isPersonalResponse(context: PipelineContext): boolean {
  return !!(
    context.hasUserLearningContext ||
    context.isFollowUpMessage ||
    context.userProfileInjected
  );
}

/**
 * Cache key scoping: query embedding dicari hanya dalam scope
 * subject + jenjang yang sama, supaya "apa itu hukum newton" untuk
 * SMP tidak ke-cache-hit oleh jawaban yang ditujukan untuk Kuliah.
 */
export async function checkSemanticCache(
  context: PipelineContext,
): Promise<SemanticCacheResult> {
  if (isPersonalResponse(context)) {
    return { hit: false };
  }

  try {
    const queryVector = await embedText(context.query, "search_query"); // Expected 1 arguments, but got 2.

    const searchResult = await qdrantClient.search(QDRANT_COLLECTIONS.CACHE, {
      vector: queryVector,
      limit: 1,
      filter: {
        must: [
          { key: "subject", match: { value: context.subject } },
          { key: "jenjang", match: { value: context.jenjang } },
        ],
      },
      with_payload: true,
    });

    const topMatch = searchResult[0];

    if (!topMatch || topMatch.score < CACHE_SIMILARITY_THRESHOLD) {
      return { hit: false };
    }

    const cacheDoc = await CachedResponse.findOne({
      vectorRefId: String(topMatch.id),
    });

    if (!cacheDoc) {
      // Vector ada di Qdrant tapi dokumen Mongo hilang (inkonsistensi) —
      // treat sebagai miss, jangan throw.
      logger.warn(
        `[SemanticCache] Vector ${topMatch.id} ditemukan di Qdrant tapi tidak ada di MongoDB`,
      );
      return { hit: false };
    }

    // Update hit_count & last_hit_at (fire-and-forget, tidak blocking)
    CachedResponse.updateOne(
      { _id: cacheDoc._id },
      { $inc: { hitCount: 1 }, $set: { lastHitAt: new Date() } },
    ).catch((err) =>
      logger.warn(`[SemanticCache] Gagal update hit_count: ${err.message}`),
    );

    logger.info(
      `[SemanticCache] HIT — score: ${topMatch.score.toFixed(3)}, subject: ${context.subject}`,
    );

    return {
      hit: true,
      responseText: cacheDoc.responseFinal,
      cacheId: String(cacheDoc._id),
    };
  } catch (error) {
    logger.error(
      `[SemanticCache] Error saat cek cache: ${(error as Error).message}`,
    );
    // Fail-safe: kalau cache lookup error, treat sebagai miss,
    // jangan sampai gagalnya cache menghentikan seluruh pipeline.
    return { hit: false };
  }
}

/**
 * Simpan response ke cache. Hanya dipanggil jika isPersonalResponse()
 * false — pemanggil (pipeline.ts) wajib cek ini sebelum panggil store.
 */
export async function storeSemanticCache(
  context: PipelineContext,
  responseText: string,
): Promise<void> {
  if (isPersonalResponse(context)) {
    return;
  }

  try {
    const queryVector = await embedText(context.query, "search_query"); // Expected 1 arguments, but got 2.
    const pointId = crypto.randomUUID();

    await qdrantClient.upsert(QDRANT_COLLECTIONS.CACHE, {
      points: [
        {
          id: pointId,
          vector: queryVector,
          payload: {
            subject: context.subject,
            jenjang: context.jenjang,
          },
        },
      ],
    });

    await CachedResponse.create({
      queryOriginal: context.query,
      vectorRefId: pointId,
      responseFinal: responseText,
      subjectTag: context.subject,
      jenjangTag: context.jenjang,
    });

    logger.info(
      `[SemanticCache] Stored — subject: ${context.subject}, jenjang: ${context.jenjang}`,
    );
  } catch (error) {
    // Gagal nyimpen cache tidak boleh gagalkan response ke user —
    // log saja dan lanjut.
    logger.warn(
      `[SemanticCache] Gagal simpan cache: ${(error as Error).message}`,
    );
  }
}
