// src/modules/ai/ui/uiBlock.classifier.ts
// Layer deteksi: apakah jawaban AI yang baru di-generate cocok dibungkus
// jadi UI block tertentu (quiz/table/step_solution dst)?
//
// Strategi 2 tahap (hemat cost):
//   1. Keyword hint check dulu (gratis, instan) — kalau gak ada hint
//      sama sekali di query ATAU jawaban, skip langsung tanpa LLM call.
//   2. Kalau ada hint, baru panggil model ringan (CHAT_LIGHT) untuk
//      konfirmasi & tentukan block type secara lebih akurat.

import { cohereClient } from "../../../config/cohere.js";
import { MODELS } from "../../../constants/models.js";
import {
  ACTIVE_UI_BLOCK_TYPES,
  UI_BLOCK_TRIGGER_HINTS,
  type UIBlockType,
} from "../../../constants/uiBlocks.js";
import type { UIBlockClassificationResult } from "../../../types/uiBlock.types.js";
import { logger } from "../../../utils/logger.js";

function findHintedTypes(query: string, answerText: string): UIBlockType[] {
  const combined = `${query} ${answerText}`.toLowerCase();
  const matched: UIBlockType[] = [];

  for (const blockType of ACTIVE_UI_BLOCK_TYPES) {
    const hints = UI_BLOCK_TRIGGER_HINTS[blockType];
    if (hints.some((hint) => combined.includes(hint.toLowerCase()))) {
      matched.push(blockType);
    }
  }

  return matched;
}

export async function classifyUIBlockNeed(
  query: string,
  answerText: string,
): Promise<UIBlockClassificationResult> {
  const hintedTypes = findHintedTypes(query, answerText);

  // Tidak ada hint sama sekali -> skip tanpa LLM call (hemat cost)
  if (hintedTypes.length === 0) {
    return { shouldGenerate: false, blockType: null, confidence: 0 };
  }

  try {
    const prompt = `Pertanyaan siswa: "${query}"

Jawaban AI: "${answerText.slice(0, 1500)}"

Kandidat tipe UI block yang relevan: ${hintedTypes.join(", ")}

Tentukan apakah jawaban ini SEBAIKNYA dibungkus jadi salah satu UI block interaktif di atas (bukan sekadar teks biasa). UI block hanya cocok jika benar-benar menambah nilai (misal: ada beberapa soal kuis konkret, ada data tabular yang jelas, atau ada langkah pengerjaan matematis terstruktur).

Jawab HANYA dalam format JSON murni tanpa markdown:
{"shouldGenerate": boolean, "blockType": string atau null, "confidence": number 0-1}`;

    const response = await cohereClient.chat({
      model: MODELS.CHAT_LIGHT,
      message: prompt,
    });

    const cleaned = response.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as UIBlockClassificationResult;

    if (!parsed.shouldGenerate || !parsed.blockType) {
      return {
        shouldGenerate: false,
        blockType: null,
        confidence: parsed.confidence ?? 0,
      };
    }

    if (!ACTIVE_UI_BLOCK_TYPES.includes(parsed.blockType as UIBlockType)) {
      return { shouldGenerate: false, blockType: null, confidence: 0 };
    }

    return parsed;
  } catch (error) {
    logger.warn(
      `[UIBlockClassifier] Gagal klasifikasi, skip UI block: ${(error as Error).message}`,
    );
    return { shouldGenerate: false, blockType: null, confidence: 0 };
  }
}
