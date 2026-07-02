// src/modules/ai/pipeline.ts
// Section 4 planning — FLOW UTAMA pipeline AI (di luar layer yang sudah
// jalan di middleware sebelumnya: content filter, abuse guard, idempotency
// check — itu semua di-handle di middlewares/ & conversation/message.service.ts
// SEBELUM pipeline ini dipanggil).
//
// Pipeline ini fokus ke:
//   Semantic Cache Check -> RAG Engine -> LLM Model(s) -> Basic Output
//   Filter -> Generative UI resolve -> return PipelineFinalResult
//   (pengiriman ke client — sekarang JSON response tunggal, bukan SSE —
//   di-handle oleh stream.ts, pipeline ini cukup return hasil lengkap)

import {
  checkSemanticCache,
  storeSemanticCache,
} from "../cache/semantic.cache.js";
import { retrieveRAGContext } from "../knowledge/rag.service.js";
import { buildSystemPrompt } from "./prompts/system.prompt.js";
import { generateDraft } from "./models/drafter.js";
import { generateDraftAndCritique } from "./models/draftCritic.js";
import { generateFinal } from "./models/finalizer.js";
import { validateLLMOutput } from "../filter/output.filter.js";
import { resolveUIBlock } from "./ui/uiBlock.orchestrator.js";
import { estimateCostUsd } from "../../utils/tokenCounter.js";
import type {
  PipelineContext,
  PipelineFinalResult,
  PipelineTier,
} from "../../types/pipeline.types.js";
import { logger } from "../../utils/logger.js";

/**
 * Free tier: RAG -> 1 Model (drafter) -> Output Filter
 */
async function runFreeTierPipeline(
  context: PipelineContext,
  systemPrompt: string,
): Promise<{
  text: string;
  tokensUsed: number;
  latencyMs: number;
  modelUsed: string;
}> {
  const result = await generateDraft(systemPrompt, context.query);
  return result;
}

/**
 * Premium tier: RAG -> (draft+kritik dalam 1 call) -> final. 2 sequential
 * LLM call, bukan 3. DIUBAH dari draft->critic->final terpisah supaya
 * muat di limit durasi function Vercel Hobby (10s) — critic tetap butuh
 * draft duluan (dependency logis, tidak bisa Promise.all() beneran),
 * jadi solusinya draft+critique digabung jadi satu call sekaligus,
 * bukan dipaksa paralel.
 */
async function runPremiumTierPipeline(
  context: PipelineContext,
  systemPrompt: string,
): Promise<{
  text: string;
  tokensUsed: number;
  latencyMs: number;
  modelUsed: string;
}> {
  const startTime = Date.now();

  const draftCritic = await generateDraftAndCritique(context.query);
  const final = await generateFinal(
    systemPrompt,
    context.query,
    draftCritic.draft,
    draftCritic.critique,
  );

  const totalTokens = draftCritic.tokensUsed + final.tokensUsed;
  const totalLatency = Date.now() - startTime;

  return {
    text: final.text,
    tokensUsed: totalTokens,
    latencyMs: totalLatency,
    modelUsed: final.modelUsed,
  };
}

export async function runPipeline(
  context: PipelineContext,
  tier: PipelineTier,
): Promise<PipelineFinalResult> {
  // 1. Semantic Cache Check (skip otomatis kalau isPersonalResponse — Section 6)
  const cacheResult = await checkSemanticCache(context);

  if (cacheResult.hit && cacheResult.responseText) {
    const uiBlock = await resolveUIBlock(
      context.query,
      cacheResult.responseText,
    );

    return {
      responseText: cacheResult.responseText,
      uiBlock,
      tokensUsed: 0,
      latencyMs: 0,
      modelUsed: "cache",
      cacheHit: true,
      ragMiss: false,
    };
  }

  // 2. RAG Engine
  const ragResult = await retrieveRAGContext(
    context.query,
    context.subject,
    context.jenjang,
  );

  // 3. Build system prompt (Section 16 — include disclaimer kalau RAG miss)
  const systemPrompt = buildSystemPrompt({
    subject: context.subject,
    jenjang: context.jenjang,
    ragChunks: ragResult.chunks,
    ragMiss: ragResult.ragMiss,
  });

  // 4. LLM Model(s) — sesuai tier
  const generation =
    tier === "premium"
      ? await runPremiumTierPipeline(context, systemPrompt)
      : await runFreeTierPipeline(context, systemPrompt);

  // 5. Basic Output Filter — validasi sebelum dikirim ke client (Section 5)
  const isOutputValid = validateLLMOutput(generation.text);

  if (!isOutputValid) {
    logger.warn(
      `[Pipeline] Output LLM tidak lolos validasi untuk user ${context.userId}, query: "${context.query.slice(0, 80)}"`,
    );
    throw new Error("OUTPUT_VALIDATION_FAILED");
  }

  // 6. Generative UI — resolve UI block (hybrid: dipanggil SETELAH teks
  // utama selesai di-generate, sebelum di-return ke stream.ts yang akan
  // mengirim ui_block bersamaan dengan responseText dalam satu JSON)
  const uiBlock = await resolveUIBlock(context.query, generation.text);

  // 7. Store ke semantic cache (no-op otomatis kalau isPersonalResponse)
  await storeSemanticCache(context, generation.text);

  return {
    responseText: generation.text,
    uiBlock,
    tokensUsed: generation.tokensUsed,
    latencyMs: generation.latencyMs,
    modelUsed: generation.modelUsed,
    cacheHit: false,
    ragMiss: ragResult.ragMiss,
  };
}

export function estimatePipelineCost(tokensUsed: number): number {
  // Estimasi kasar: asumsikan split 40% input / 60% output untuk
  // keperluan dashboard cost tracking (Section 10). Bukan billing aktual.
  const inputTokens = Math.round(tokensUsed * 0.4);
  const outputTokens = tokensUsed - inputTokens;
  return estimateCostUsd(inputTokens, outputTokens);
}
