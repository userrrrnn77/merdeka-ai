// src/modules/knowledge/seeder/seed.ts
// Section 7 planning, FLOW PENGISIAN DB:
//   Seed mandiri (Tier 1) -> Sumber lisensi eksplisit (Tier 2) ->
//   Parse + chunk (~500 token) + clean -> MongoDB + Vector DB
//
// Script ini idempotent: re-run aman, slug yang sudah ada akan di-skip
// (gunakan --force untuk re-seed paksa, misal saat konten direvisi).

import { KnowledgeSource } from "../../../models/knowledgeSource.model.js";
import { chunkText } from "../../../utils/chunker.js";
import { cleanCrawledText } from "../../../utils/textCleaner.js";
import { embedTexts } from "../../cache/embed.js";
import { qdrantClient, QDRANT_COLLECTIONS } from "../../../config/vectordb.js";
import { ORIGINAL_SEED_CONTENT } from "./original.seed.js";
import type { KnowledgeSourceInput } from "../../../types/knowledge.types.js";
import { logger } from "../../../utils/logger.js";

async function seedOneSource(
  input: KnowledgeSourceInput,
  force: boolean,
): Promise<void> {
  const existing = await KnowledgeSource.findOne({ slug: input.slug });

  if (existing && !force) {
    logger.info(
      `[Seed] Skip "${input.slug}" — sudah ada (pakai --force untuk re-seed)`,
    );
    return;
  }

  const cleanedText = cleanCrawledText(input.fullText);
  const textChunks = chunkText(cleanedText);

  if (textChunks.length === 0) {
    logger.warn(`[Seed] Skip "${input.slug}" — tidak ada chunk dihasilkan`);
    return;
  }

  // Embed semua chunk sekaligus (search_document, bukan search_query —
  // ini konten knowledge base, bukan query user)
  const vectors = await embedTexts(
    textChunks.map((c) => c.text),
    "search_document",
  ); // Expected 1 arguments, but got 2.
  // Hapus dokumen lama jika force re-seed (termasuk vector Qdrant lama)
  if (existing) {
    await deleteSourceVectors(String(existing._id));
    await KnowledgeSource.deleteOne({ _id: existing._id });
  }

  const sourceDoc = await KnowledgeSource.create({
    source: input.source,
    sourceTier: input.sourceTier,
    license: input.license,
    sourceWeight: input.sourceWeight,
    lang: input.lang,
    title: input.title,
    slug: input.slug,
    fullText: cleanedText,
    chunks: textChunks.map((c) => ({ chunkId: c.chunkId, text: c.text })),
    subjectTags: input.subjectTags,
    fetchedAt: new Date(),
    lastUpdated: new Date(),
  });

  // Upsert ke Qdrant — payload hanya metadata ringan, full text tetap
  // sumber kebenaran di MongoDB (rag.service.ts hydrate dari sana).
  await qdrantClient.upsert(QDRANT_COLLECTIONS.KNOWLEDGE, {
    points: textChunks.map((chunk, idx) => ({
      id: crypto.randomUUID(),
      vector: vectors[idx],
      payload: {
        sourceId: String(sourceDoc._id),
        chunkId: chunk.chunkId,
        sourceTier: input.sourceTier,
        sourceWeight: input.sourceWeight,
        sourceTitle: input.title,
        subjectTags: input.subjectTags,
      },
    })),
  });

  logger.info(
    `[Seed] "${input.slug}" berhasil di-seed — ${textChunks.length} chunk`,
  );
}

async function deleteSourceVectors(sourceId: string): Promise<void> {
  await qdrantClient.delete(QDRANT_COLLECTIONS.KNOWLEDGE, {
    filter: {
      must: [{ key: "sourceId", match: { value: sourceId } }],
    },
  });
}

export async function runSeed(
  options: { force?: boolean } = {},
): Promise<void> {
  const force = options.force ?? false;

  logger.info(
    `[Seed] Mulai seeding ${ORIGINAL_SEED_CONTENT.length} sumber Tier 1...`,
  );

  for (const item of ORIGINAL_SEED_CONTENT) {
    try {
      await seedOneSource(item, force);
    } catch (error) {
      logger.error(
        `[Seed] Gagal seed "${item.slug}": ${(error as Error).message}`,
      );
    }
  }

  logger.info("[Seed] Selesai.");
}

// Jalankan langsung via: bun run src/modules/knowledge/seeder/seed.ts [--force]
if (import.meta.main) {
  const force = process.argv.includes("--force");
  const connectDB = (await import("../../../config/db.js")).default;

  connectDB()
    .then(() => runSeed({ force }))
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error(`[Seed] Fatal error: ${(error as Error).message}`);
      process.exit(1);
    });
}
