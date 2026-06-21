// src/modules/ai/stream.ts
// Section 4A planning — backend SSE. Format event: text/event-stream,
// chunk per "data: {...}\n\n", event "done" include remaining_quota,
// event "error" kalau ada masalah.
//
// CATATAN STREAMING STRATEGY: pipeline.ts menunggu LLM selesai penuh
// dulu (output filter & UI block classifier butuh teks lengkap), jadi
// stream.ts ini melakukan SIMULATED STREAMING — pecah teks hasil jadi
// potongan kata, kirim ber-delay kecil supaya FE tetap dapat pengalaman
// streaming meskipun generation sebenarnya sudah selesai di backend.

import type { Response } from "express";
import { runPipeline, estimatePipelineCost } from "./pipeline.js";
import type {
  PipelineContext,
  PipelineTier,
} from "../../types/pipeline.types.js";
import { logger } from "../../utils/logger.js";

const SIMULATED_CHUNK_WORD_COUNT = 3; // kirim ~3 kata per chunk
const SIMULATED_CHUNK_DELAY_MS = 35; // delay antar chunk, terasa natural

function writeSSEEvent(
  res: Response,
  eventName: "chunk" | "ui_block" | "done" | "error",
  data: unknown,
): void {
  if (eventName === "chunk") {
    // event "chunk" tidak pakai field "event:" eksplisit di planning
    // (default message event), hanya "data:" — konsisten dengan contoh
    // Section 4A: data: {"chunk": "teks jawaban..."}\n\n
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } else {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitIntoWordChunks(text: string, wordsPerChunk: number): string[] {
  const words = text.split(/(\s+)/); // keep whitespace agar spasi tidak hilang
  const chunks: string[] = [];
  let buffer = "";
  let wordCount = 0;

  for (const token of words) {
    buffer += token;
    if (token.trim().length > 0) {
      wordCount += 1;
    }
    if (wordCount >= wordsPerChunk) {
      chunks.push(buffer);
      buffer = "";
      wordCount = 0;
    }
  }

  if (buffer.length > 0) {
    chunks.push(buffer);
  }

  return chunks;
}

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
 * Setup header SSE standar. Dipanggil sekali di awal request handler
 * (controller) sebelum streamPipelineResult().
 */
export function setupSSEHeaders(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
}

/**
 * Jalankan pipeline AI penuh, lalu stream hasilnya ke client sebagai
 * SSE events: chunk* -> [ui_block]? -> done.
 * onComplete dipanggil SEBELUM event "done" dikirim, supaya caller bisa
 * persist message ke DB & hitung remaining_quota yang akurat (Section 4B
 * idempotency — message disimpan oleh conversation/message.service.ts).
 */
export async function streamPipelineResult(
  params: StreamPipelineParams,
): Promise<void> {
  const { res, context, tier, remainingQuotaAfter, onComplete } = params;

  let closed = false;
  res.on("close", () => {
    closed = true;
  });

  try {
    const result = await runPipeline(context, tier);
    const costEst = estimatePipelineCost(result.tokensUsed);

    // Simulated streaming: pecah teks jadi potongan kata
    const wordChunks = splitIntoWordChunks(
      result.responseText,
      SIMULATED_CHUNK_WORD_COUNT,
    );

    for (const chunk of wordChunks) {
      if (closed) {
        logger.info(
          `[Stream] Koneksi ditutup user sebelum stream selesai (user: ${context.userId})`,
        );
        return;
      }
      writeSSEEvent(res, "chunk", { chunk });
      await wait(SIMULATED_CHUNK_DELAY_MS);
    }

    if (closed) return;

    // Generative UI — kirim sebagai event terpisah SEBELUM event done
    // (hybrid approach yang disepakati)
    if (result.uiBlock) {
      writeSSEEvent(res, "ui_block", { ui_block: result.uiBlock });
    }

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

    if (closed) return;

    writeSSEEvent(res, "done", {
      remaining_quota: remainingQuotaAfter,
    });

    res.end();
  } catch (error) {
    const message = (error as Error).message;
    logger.error(
      `[Stream] Pipeline error untuk user ${context.userId}: ${message}`,
    );

    if (!closed) {
      const userMessage =
        message === "OUTPUT_VALIDATION_FAILED"
          ? "Maaf, terjadi kesalahan saat memproses jawaban. Coba ajukan ulang pertanyaanmu."
          : "Terjadi kesalahan. Coba lagi beberapa saat.";

      writeSSEEvent(res, "error", { message: userMessage });
      res.end();
    }
  }
}
