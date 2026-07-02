// src/modules/ai/stream.ts
// DIUBAH untuk kompatibel Vercel Hobby free tier: SSE simulated-streaming
// dihapus (butuh koneksi long-lived + res.write per chunk, riskan kena
// limit durasi function). Sekarang pipeline dijalankan penuh lalu hasil
// dikirim SEKALI sebagai JSON biasa. Nama fungsi dipertahankan supaya
// chat.controller.ts tidak perlu banyak berubah.

import type { Response } from "express";
import { runPipeline, estimatePipelineCost } from "./pipeline.js";
import type {
  PipelineContext,
  PipelineTier,
} from "../../types/pipeline.types.js";
import { logger } from "../../utils/logger.js";

export interface StreamPipelineParams {
  res: Response;
  context: PipelineContext;
  tier: PipelineTier;
  remainingQuotaAfter: number;
  onComplete: (result: {
    responseText: string;
    uiBlock: unknown;
    tokensUsed: number;
    latencyMs: number;
    modelUsed: string;
    cacheHit: boolean;
    ragMiss: boolean;
    costEst: number;
  }) => Promise<void>;
}

/**
 * DIPERTAHANKAN sebagai no-op supaya caller lama tidak error kalau masih
 * memanggilnya. Response non-streaming cukup pakai res.json() biasa.
 */
export function setupSSEHeaders(_res: Response): void {
  // no-op — tidak ada SSE lagi di versi Vercel ini
}

/**
 * Jalankan pipeline AI penuh, lalu kirim hasilnya SEKALI sebagai JSON:
 * { chunk, ui_block, remaining_quota }.
 * onComplete tetap dipanggil SEBELUM response dikirim, supaya caller bisa
 * persist message ke DB & hitung remaining_quota yang akurat.
 */
export async function streamPipelineResult(
  params: StreamPipelineParams,
): Promise<void> {
  const { res, context, tier, remainingQuotaAfter, onComplete } = params;

  try {
    const result = await runPipeline(context, tier);
    const costEst = estimatePipelineCost(result.tokensUsed);

    await onComplete({
      responseText: result.responseText,
      uiBlock: result.uiBlock,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      modelUsed: result.modelUsed,
      cacheHit: result.cacheHit,
      ragMiss: result.ragMiss,
      costEst,
    });

    res.status(200).json({
      chunk: result.responseText,
      ui_block: result.uiBlock ?? null,
      remaining_quota: remainingQuotaAfter,
    });
  } catch (error) {
    const message = (error as Error).message;
    logger.error(
      `[Chat] Pipeline error untuk user ${context.userId}: ${message}`,
    );

    const userMessage =
      message === "OUTPUT_VALIDATION_FAILED"
        ? "Maaf, terjadi kesalahan saat memproses jawaban. Coba ajukan ulang pertanyaanmu."
        : "Terjadi kesalahan. Coba lagi beberapa saat.";

    res.status(500).json({ error: userMessage });
  }
}
