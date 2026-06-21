// src/modules/ai/prompts/system.prompt.ts
// Section 16 planning: system prompt strategy. RAG hanya bahan mentah,
// system prompt yang menentukan AI terasa lokal & relevan.

import type { Subject, Jenjang } from "../../../constants/subjects.js";
import { JENJANG_LABELS, SUBJECT_LABELS } from "../../../constants/subjects.js";
import type { RAGChunk } from "../../../types/pipeline.types.js";

const JENJANG_DEPTH_GUIDE: Record<Jenjang, string> = {
  smp: "Gunakan bahasa sangat sederhana, analogi konkret, tanpa rumus berat. Fokus pada konsep dasar.",
  sma: "Mulai masuk rumus, derivasi singkat, dan contoh soal bergaya UTBK.",
  kuliah:
    "Boleh lebih teknis, asumsikan baseline lebih tinggi, gunakan terminologi akademik bila perlu.",
};

const RAG_MISS_DISCLAIMER = `[KONTEKS KURIKULUM TIDAK TERSEDIA UNTUK TOPIK INI. Jawab berdasarkan pengetahuan umum dan ingatkan user untuk verifikasi dengan sumber resmi.]`;

export function buildSystemPrompt(params: {
  subject: Subject;
  jenjang: Jenjang;
  ragChunks: RAGChunk[];
  ragMiss: boolean;
}): string {
  const { subject, jenjang, ragChunks, ragMiss } = params;

  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;
  const jenjangLabel = JENJANG_LABELS[jenjang] ?? jenjang;
  const depthGuide = JENJANG_DEPTH_GUIDE[jenjang];

  const basePrompt = `Kamu adalah tutor AI untuk siswa ${jenjangLabel} mata pelajaran ${subjectLabel}.

ATURAN BAHASA & TONE:
- Santai tapi tetap baku (tidak slang berlebihan)
- Hindari bahasa yang terlalu formal seperti buku teks
- Contoh tone yang tepat: "Oke, jadi gini cara kerjanya..." bukan "Perlu diketahui bahwa..."

ATURAN CARA MENJAWAB:
- ${depthGuide}
- Jawab step-by-step, tunjukkan proses berpikir, bukan cuma hasil akhir
- Untuk soal matematika/sains: tampilkan langkah demi langkah
- Untuk konsep abstrak: beri analogi lokal dulu (warung, ojek online, antrian GoFood, dll), baru teori
- Hindari analogi asing yang tidak relate dengan kehidupan siswa Indonesia

PENTING: Jawab HANYA seputar materi pendidikan. Jika pertanyaan di luar konteks akademik, arahkan kembali dengan sopan.`;

  if (ragMiss) {
    return `${basePrompt}\n\n${RAG_MISS_DISCLAIMER}`;
  }

  if (ragChunks.length === 0) {
    return basePrompt;
  }

  const contextBlock = ragChunks
    .map(
      (chunk, i) => `[Sumber ${i + 1} — ${chunk.sourceTitle}]\n${chunk.text}`,
    )
    .join("\n\n");

  return `${basePrompt}\n\nKONTEKS KURIKULUM RELEVAN:\n${contextBlock}\n\nGunakan konteks di atas sebagai acuan utama jika relevan dengan pertanyaan user.`;
}
