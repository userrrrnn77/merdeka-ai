// src/modules/ai/ui/uiBlock.orchestrator.ts
// Entry point tunggal untuk generative UI — dipanggil dari pipeline.ts
// SETELAH teks utama selesai di-generate & di-stream (hybrid approach
// yang disepakati: teks stream dulu, UI block nyusul sebagai event terpisah).

import { classifyUIBlockNeed } from "./uiBlock.classifier.js";
import { generateUIBlock } from "./uiBlock.generator.js";
import type { UIBlockSchema } from "../../../types/uiBlock.types.js";
import { logger } from "../../../utils/logger.js";

export async function resolveUIBlock(
  query: string,
  answerText: string,
): Promise<UIBlockSchema | null> {
  const classification = await classifyUIBlockNeed(query, answerText);

  if (!classification.shouldGenerate || !classification.blockType) {
    return null;
  }

  logger.info(
    `[UIBlock] Classifier memutuskan generate "${classification.blockType}" (confidence: ${classification.confidence})`,
  );

  const block = await generateUIBlock(
    classification.blockType,
    query,
    answerText,
  );
  return block;
}
