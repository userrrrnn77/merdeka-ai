// src/modules/ai/prompts/critic.prompt.ts
// Premium tier pipeline (Section 4): Model A (draft) + Model B (kritik)
// jalan paralel via Promise.all(), lalu digabung Model C (final).

export function buildCriticPrompt(query: string, draftAnswer: string): string {
  return `Kamu adalah reviewer akademik yang ketat. Berikan kritik singkat dan konstruktif terhadap draft jawaban berikut untuk pertanyaan siswa.

PERTANYAAN SISWA:
${query}

DRAFT JAWABAN:
${draftAnswer}

Identifikasi:
1. Apakah ada kesalahan faktual atau perhitungan?
2. Apakah ada langkah yang kurang jelas atau membingungkan?
3. Apakah ada bagian yang bisa disederhanakan?

Jawab dalam bentuk poin-poin singkat. Jika draft sudah baik tanpa masalah berarti, katakan demikian secara singkat.`;
}
