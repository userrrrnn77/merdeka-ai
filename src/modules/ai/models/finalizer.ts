// src/modules/ai/models/finalizer.ts

import { cohereClient } from "../../../config/cohere.js";
import { PREMIUM_PIPELINE_MODELS } from "../../../constants/models.js";
import { buildFinalizerPrompt } from "../prompts/finalizer.prompt.js";
import type { LLMGenerationResult } from "../../../types/pipeline.types.js";

export async function generateFinal(
  systemPrompt: string,
  query: string,
  draftAnswer: string,
  criticNotes: string,
): Promise<LLMGenerationResult> {
  const startTime = Date.now();
  const prompt = buildFinalizerPrompt(query, draftAnswer, criticNotes);

  const response = await cohereClient.chat({
    model: PREMIUM_PIPELINE_MODELS.FINALIZER,
    preamble: systemPrompt,
    message: prompt,
  });

  const latencyMs = Date.now() - startTime;

  return {
    text: response.text,
    tokensUsed:
      (response.meta?.billedUnits?.inputTokens ?? 0) +
      (response.meta?.billedUnits?.outputTokens ?? 0),
    latencyMs,
    modelUsed: PREMIUM_PIPELINE_MODELS.FINALIZER,
  };
}