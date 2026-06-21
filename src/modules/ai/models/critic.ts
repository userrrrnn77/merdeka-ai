// src/modules/ai/models/critic.ts

import { cohereClient } from "../../../config/cohere.js";
import { PREMIUM_PIPELINE_MODELS } from "../../../constants/models.js";
import { buildCriticPrompt } from "../prompts/critic.prompt.js";
import type { LLMGenerationResult } from "../../../types/pipeline.types.js";

export async function generateCritique(
  query: string,
  draftAnswer: string,
): Promise<LLMGenerationResult> {
  const startTime = Date.now();
  const prompt = buildCriticPrompt(query, draftAnswer);

  const response = await cohereClient.chat({
    model: PREMIUM_PIPELINE_MODELS.CRITIC,
    message: prompt,
  });

  const latencyMs = Date.now() - startTime;

  return {
    text: response.text,
    tokensUsed:
      (response.meta?.billedUnits?.inputTokens ?? 0) +
      (response.meta?.billedUnits?.outputTokens ?? 0),
    latencyMs,
    modelUsed: PREMIUM_PIPELINE_MODELS.CRITIC,
  };
}
