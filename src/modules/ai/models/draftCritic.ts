// src/modules/ai/models/draftCritic.ts
// DIBUAT untuk kompatibel Vercel Hobby: menggantikan generateDraft() +
// generateCritique() terpisah (2 call) jadi 1 call Cohere yang
// menghasilkan draft & kritik sekaligus. Lihat draftCritic.prompt.ts.

import { cohereClient } from "../../../config/cohere.js";
import { PREMIUM_PIPELINE_MODELS } from "../../../constants/models.js";
import {
  buildDraftCriticPrompt,
  parseDraftCriticResponse,
} from "../prompts/draftCritic.prompt.js";

export interface DraftCriticResult {
  draft: string;
  critique: string;
  tokensUsed: number;
  latencyMs: number;
  modelUsed: string;
}

export async function generateDraftAndCritique(
  query: string,
): Promise<DraftCriticResult> {
  const startTime = Date.now();
  const prompt = buildDraftCriticPrompt(query);

  const response = await cohereClient.chat({
    model: PREMIUM_PIPELINE_MODELS.DRAFTER,
    message: prompt,
  });

  const latencyMs = Date.now() - startTime;
  const { draft, critique } = parseDraftCriticResponse(response.text);

  return {
    draft,
    critique,
    tokensUsed:
      (response.meta?.billedUnits?.inputTokens ?? 0) +
      (response.meta?.billedUnits?.outputTokens ?? 0),
    latencyMs,
    modelUsed: PREMIUM_PIPELINE_MODELS.DRAFTER,
  };
}
