// src/modules/filter/intent.classifier.ts
// Section 5 planning, Tahap 5: ML Classifier — opsional, ditambah jika
// rule-based dirasa kurang. Untuk MVP, ini diisi versi ringan berbasis
// model Cohere yang murah (CHAT_LIGHT), bukan model ML terpisah yang
// butuh training/hosting sendiri. Dipanggil hanya untuk kasus ambigu
// yang lolos dari content.filter.ts & abuse.middleware.ts tapi masih
// dicurigai di luar konteks pendidikan.
//
// CATATAN: ini BUKAN dipanggil di setiap request (mahal & tidak perlu).
// Dipanggil opsional di pipeline.ts kalau heuristik rule-based kurang
// yakin. Untuk MVP awal, module ini disediakan tapi belum di-wire ke
// pipeline utama — aktifkan saat ada data nyata yang nunjukin rule-based
// gak cukup (lihat feedback_logs & usage_logs).

import { cohereClient } from "../../config/cohere.js";
import { MODELS } from "../../constants/models.js";
import { logger } from "../../utils/logger.js";

export interface IntentClassificationResult {
  isEducational: boolean;
  confidence: number;
}

export async function classifyEducationalIntent(
  query: string,
): Promise<IntentClassificationResult> {
  try {
    const prompt = `Tentukan apakah pertanyaan berikut adalah pertanyaan seputar materi akademik/pendidikan (pelajaran sekolah, kuliah, UTBK, dst) atau bukan.

PERTANYAAN: "${query}"

Jawab HANYA dengan JSON murni tanpa markdown:
{"isEducational": boolean, "confidence": number 0-1}`;

    const response = await cohereClient.chat({
      model: MODELS.CHAT_LIGHT,
      message: prompt,
    });

    const cleaned = response.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as IntentClassificationResult;

    return {
      isEducational: !!parsed.isEducational,
      confidence: parsed.confidence ?? 0.5,
    };
  } catch (error) {
    logger.warn(
      `[IntentClassifier] Gagal klasifikasi, fail-open (anggap edukatif): ${(error as Error).message}`,
    );
    // Fail-open: kalau classifier error, jangan blokir user secara
    // tidak adil. Rule-based filter di abuse.middleware.ts tetap jadi
    // garis pertahanan utama.
    return { isEducational: true, confidence: 0 };
  }
}
