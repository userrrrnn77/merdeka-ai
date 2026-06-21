// src/modules/ai/models/drafter.ts

import { cohereClient } from "../../../config/cohere.js";
import { MODELS } from "../../../constants/models.js";
import { buildDrafterUserPrompt } from "../prompts/drafter.prompt.js";
import type { LLMGenerationResult } from "../../../types/pipeline.types.js";

export async function generateDraft(
  systemPrompt: string,
  query: string,
): Promise<LLMGenerationResult> {
  const startTime = Date.now();
  const userPrompt = buildDrafterUserPrompt(query);

  const response = await cohereClient.chat({
    model: MODELS.CHAT_DEFAULT,
    preamble: systemPrompt,
    message: userPrompt,
  });

  const latencyMs = Date.now() - startTime;

  return {
    text: response.text,
    tokensUsed:
      (response.meta?.billedUnits?.inputTokens ?? 0) +
      (response.meta?.billedUnits?.outputTokens ?? 0),
    latencyMs,
    modelUsed: MODELS.CHAT_DEFAULT,
  };
}
