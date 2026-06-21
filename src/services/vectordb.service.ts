// src/services/vectordb.service.ts
// FIX: `vectors_count` tidak ada di CollectionInfo type Qdrant SDK versi ini.
// Pakai `indexed_vectors_count` (optional) atau skip field count-nya sama sekali.
// Untuk info collection count yang akurat, pakai getCollection() per nama.

import { qdrantClient, QDRANT_COLLECTIONS } from "../config/vectordb.js";
import { logger } from "../utils/logger.js";

export interface CollectionStats {
  name: string;
  status: string;
  indexedVectorsCount: number | null;
}

/**
 * Info dasar semua collection yang dipakai.
 */
export async function getCollectionStats(): Promise<CollectionStats[]> {
  const results: CollectionStats[] = [];

  for (const collectionName of Object.values(QDRANT_COLLECTIONS)) {
    try {
      const info = await qdrantClient.getCollection(collectionName);
      results.push({
        name: collectionName,
        status: info.status,
        // FIX: pakai indexed_vectors_count (ada di SDK), bukan vectors_count (tidak ada)
        indexedVectorsCount: info.indexed_vectors_count ?? null,
      });
    } catch (error) {
      logger.warn(
        `[VectorDB] Gagal ambil stats collection "${collectionName}": ${(error as Error).message}`,
      );
      results.push({
        name: collectionName,
        status: "unknown",
        indexedVectorsCount: null,
      });
    }
  }

  return results;
}

/**
 * Hapus semua vector di collection cache (untuk manual invalidate).
 * Berguna saat dataset/prompt diupdate dan cache lama tidak relevan.
 */
export async function clearCacheCollection(): Promise<void> {
  await qdrantClient.deleteCollection(QDRANT_COLLECTIONS.CACHE);
  await qdrantClient.createCollection(QDRANT_COLLECTIONS.CACHE, {
    vectors: {
      size: 1024, // COHERE_EMBED_DIMENSION
      distance: "Cosine",
    },
  });
  logger.info("[VectorDB] Cache collection berhasil di-reset.");
}

/**
 * Hapus satu point dari collection (untuk invalidate cache spesifik).
 */
export async function deletePoint(
  collectionName: string,
  pointId: string,
): Promise<void> {
  await qdrantClient.delete(collectionName, {
    points: [pointId],
  });
  logger.info(
    `[VectorDB] Point "${pointId}" dihapus dari collection "${collectionName}".`,
  );
}
