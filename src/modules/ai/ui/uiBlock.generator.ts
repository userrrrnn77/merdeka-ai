// src/modules/ai/ui/uiBlock.generator.ts
// Generate structured JSON UI block sesuai schema, setelah classifier
// menentukan block type yang relevan.

import { cohereClient } from "../../../config/cohere.js";
import { MODELS } from "../../../constants/models.js";
import { getUIBlockSchemaDescription } from "./uiBlock.schema.js";
import type { UIBlockType } from "../../../constants/uiBlocks.js";
import type { UIBlockSchema } from "../../../types/uiBlock.types.js";
import { logger } from "../../../utils/logger.js";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function assignIdsIfMissing(
  blockType: UIBlockType,
  parsed: any,
): UIBlockSchema {
  if (blockType === "quiz" && Array.isArray(parsed.questions)) {
    parsed.questions = parsed.questions.map((q: any) => ({
      ...q,
      id: q.id || generateId(),
    }));
  }
  if (blockType === "step_solution" && Array.isArray(parsed.steps)) {
    parsed.steps = parsed.steps.map((s: any) => ({
      ...s,
      id: s.id || generateId(),
    }));
  }
  if (blockType === "flashcard" && Array.isArray(parsed.cards)) {
    parsed.cards = parsed.cards.map((c: any) => ({
      ...c,
      id: c.id || generateId(),
    }));
  }
  return parsed as UIBlockSchema;
}

export async function generateUIBlock(
  blockType: UIBlockType,
  query: string,
  answerText: string,
): Promise<UIBlockSchema | null> {
  try {
    const schemaDescription = getUIBlockSchemaDescription(blockType);

    const prompt = `Berdasarkan pertanyaan dan jawaban berikut, buat UI block dengan format JSON yang TEPAT mengikuti schema di bawah.

PERTANYAAN: ${query}

JAWABAN: ${answerText}

SCHEMA YANG WAJIB DIIKUTI (field "type" harus persis "${blockType}"):
${schemaDescription}

PENTING:
- Balas HANYA dengan JSON murni, tanpa markdown code fence, tanpa teks pembuka/penutup
- Pastikan semua field required terisi
- Konten harus relevan dan akurat berdasarkan jawaban di atas`;

    const response = await cohereClient.chat({
      model: MODELS.CHAT_DEFAULT,
      message: prompt,
    });

    const cleaned = response.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.type !== blockType) {
      parsed.type = blockType;
    }

    return assignIdsIfMissing(blockType, parsed);
  } catch (error) {
    logger.warn(
      `[UIBlockGenerator] Gagal generate UI block (${blockType}): ${(error as Error).message}`,
    );
    return null;
  }
}
