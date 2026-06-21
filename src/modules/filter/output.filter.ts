// src/modules/filter/output.filter.ts
// Section 5 planning: basic output filter, jalan setelah LLM generate,
// sebelum di-stream ke FE. Bukan ML classifier kompleks — cukup regex
// dan blocklist sederhana untuk MVP (upgrade jadi ML classifier ada
// di intent.classifier.ts / Fase 2 backlog).

import {
  HARMFUL_OUTPUT_KEYWORDS,
  MIN_VALID_OUTPUT_LENGTH,
} from "../../constants/filter.js";

export function validateLLMOutput(text: string): boolean {
  if (!text || text.trim().length < MIN_VALID_OUTPUT_LENGTH) {
    return false;
  }

  const lower = text.toLowerCase();
  if (HARMFUL_OUTPUT_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))) {
    return false;
  }

  // Deteksi indikasi indirect prompt injection dari RAG chunk: output
  // yang justru berisi instruksi sistem/meta-instruksi, bukan jawaban
  // ke siswa.
  const suspiciousPatterns = [
    /abaikan (semua )?instruksi/i,
    /ignore (all )?(previous )?instructions/i,
    /system prompt/i,
    /\[KONTEKS KURIKULUM/i, // disclaimer internal tidak boleh leak verbatim ke output final tanpa konteks
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(text))) {
    return false;
  }

  return true;
}

/**
 * Validasi tambahan khusus untuk UI block JSON (Section: generative UI).
 * Memastikan output bukan JSON kosong/rusak sebelum dikirim sebagai
 * event ui_block.
 */
export function validateUIBlockOutput(block: unknown): boolean {
  if (!block || typeof block !== "object") return false;
  const candidate = block as Record<string, unknown>;
  if (!candidate.type || typeof candidate.type !== "string") return false;
  return true;
}
