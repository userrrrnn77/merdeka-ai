// src/modules/filter/content.filter.ts
// Section 5 planning, Tahap 2: rule-based filter. Tahap 1 (rate limiting)
// & Tahap 3-4 (prompt injection guard, bot/spam detection) sudah
// di-handle di middlewares/abuse.middleware.ts. Module ini fokus ke
// validasi konten: apakah query relevan dengan konteks pendidikan.
//
// Sengaja TIDAK pakai hard blocklist topik di luar pendidikan (banyak
// false positive untuk pertanyaan ambigu). Untuk MVP, gate utama tetap
// di abuse.middleware.ts (keyword + URL + spam). File ini menyediakan
// helper tambahan yang bisa dipanggil di pipeline kalau perlu validasi
// lebih spesifik per subject/jenjang.

import { SUBJECTS, type Subject } from "../../constants/subjects.js";

export interface ContentFilterResult {
  allowed: boolean;
  reason?: string;
}

const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 4000;

/**
 * Validasi dasar panjang & isi query. Validasi format/length yang lebih
 * strict sudah di-handle zod (validate.middleware.ts: chatRequestSchema),
 * ini lapisan tambahan untuk cek konten kosong-secara-efektif (cuma
 * whitespace/simbol).
 */
export function validateQueryContent(query: string): ContentFilterResult {
  const trimmed = query.trim();

  if (trimmed.length < MIN_QUERY_LENGTH) {
    return {
      allowed: false,
      reason: "Pertanyaan terlalu pendek, mohon perjelas.",
    };
  }

  if (trimmed.length > MAX_QUERY_LENGTH) {
    return {
      allowed: false,
      reason: "Pertanyaan terlalu panjang, mohon ringkas.",
    };
  }

  // Query yang isinya cuma simbol/angka berulang tanpa huruf bermakna
  const hasMeaningfulText = /[a-zA-Z\u00C0-\u017F]{2,}/.test(trimmed);
  if (!hasMeaningfulText) {
    return {
      allowed: false,
      reason: "Pertanyaan tidak dapat dipahami, mohon tulis ulang.",
    };
  }

  return { allowed: true };
}

/**
 * Validasi subject yang dikirim FE memang dikenal sistem.
 * Dipanggil saat create conversation (Section 13A — subject di-lock
 * setelah chat pertama).
 */
export function isValidSubject(subject: string): subject is Subject {
  return Object.values(SUBJECTS).includes(subject as Subject);
}
