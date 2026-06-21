// src/modules/knowledge/rag.service.ts
// Section 7 planning: RAG core service. Similarity threshold WAJIB 0.70 —
// chunk yang tidak relevan lebih berbahaya daripada tidak ada chunk
// sama sekali (bisa confuse LLM & trigger hallucination lebih parah).
// RAG weighting: sumber dengan authority lebih tinggi dapat bobot
// retrieval lebih tinggi saat ada chunk yang bersaing untuk slot context.

import { qdrantClient, QDRANT_COLLECTIONS } from "../../config/vectordb.js";
import { env } from "../../config/env.js";
import { embedText } from "../cache/embed.js";
import { KnowledgeSource } from "../../models/knowledgeSource.model.js";
import type { RAGChunk, RAGResult } from "../../types/pipeline.types.js";
import type { Subject, Jenjang } from "../../constants/subjects.js";
import { logger } from "../../utils/logger.js";

const RAG_SIMILARITY_THRESHOLD = env.RAG_SIMILARITY_THRESHOLD;
const RAG_TOP_K = 5;

interface QdrantKnowledgePayload {
  sourceId: string;
  chunkId: number;
  sourceTier: 1 | 2 | 3;
  sourceWeight: number;
  sourceTitle: string;
  subjectTags: string[];
}

export async function retrieveRAGContext(
  query: string,
  subject: Subject,
  jenjang: Jenjang,
): Promise<RAGResult> {
  try {
    const queryVector = await embedText(query, "search_query"); // Expected 1 arguments, but got 2.

    const searchResult = await qdrantClient.search(
      QDRANT_COLLECTIONS.KNOWLEDGE,
      {
        vector: queryVector,
        limit: RAG_TOP_K,
        filter: {
          must: [{ key: "subjectTags", match: { any: [subject] } }],
        },
        with_payload: true,
      },
    );

    // Filter by similarity >= threshold (Section 7 — WAJIB)
    const relevantPoints = searchResult.filter(
      (point) => point.score >= RAG_SIMILARITY_THRESHOLD,
    );

    if (relevantPoints.length === 0) {
      logger.info(
        `[RAG] MISS — tidak ada chunk lolos threshold ${RAG_SIMILARITY_THRESHOLD} untuk subject "${subject}"`,
      );
      return { chunks: [], ragMiss: true };
    }

    const chunks: RAGChunk[] = relevantPoints.map((point) => {
      const payload = point.payload as unknown as QdrantKnowledgePayload;
      return {
        chunkId: String(point.id),
        text: "", // diisi di bawah dari MongoDB (full_text disimpan di sana, bukan di Qdrant payload)
        score: point.score,
        sourceTier: payload.sourceTier,
        sourceWeight: payload.sourceWeight,
        sourceTitle: payload.sourceTitle,
      };
    });

    // Ambil text chunk asli dari MongoDB (Qdrant payload hanya metadata
    // ringan, full text disimpan di knowledge_sources.chunks).
    await hydrateChunkText(chunks, relevantPoints);

    // RAG weighting: urutkan berdasarkan kombinasi similarity score
    // dan source_weight, supaya sumber authority tinggi diprioritaskan
    // saat ada chunk yang bersaing untuk slot context.
    chunks.sort((a, b) => b.score * b.sourceWeight - a.score * a.sourceWeight);

    logger.info(
      `[RAG] HIT — ${chunks.length} chunk relevan untuk subject "${subject}"`,
    );

    return { chunks, ragMiss: false };
  } catch (error) {
    logger.error(
      `[RAG] Error saat retrieve context: ${(error as Error).message}`,
    );
    // Fail-safe: error di RAG tidak boleh menggagalkan seluruh pipeline.
    // Treat sebagai ragMiss supaya LLM tetap jawab dari general knowledge
    // + disclaimer (sesuai Section 7 & system.prompt.ts).
    return { chunks: [], ragMiss: true };
  }
}

async function hydrateChunkText(
  chunks: RAGChunk[],
  points: Awaited<ReturnType<typeof qdrantClient.search>>,
): Promise<void> {
  const sourceIds = [
    ...new Set(
      points.map(
        (p) => (p.payload as unknown as QdrantKnowledgePayload).sourceId,
      ),
    ),
  ];

  const sources = await KnowledgeSource.find({
    _id: { $in: sourceIds },
  }).lean();
  const sourceMap = new Map(sources.map((s) => [String(s._id), s]));

  points.forEach((point, idx) => {
    const payload = point.payload as unknown as QdrantKnowledgePayload;
    const source = sourceMap.get(payload.sourceId);
    const chunkDoc = source?.chunks.find((c) => c.chunkId === payload.chunkId);
    if (chunks[idx]) {
      chunks[idx].text = chunkDoc?.text ?? "";
    }
  });
}
