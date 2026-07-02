// src/modules/ai/prompts/draftCritic.prompt.ts
// DIBUAT untuk kompatibel Vercel Hobby (limit durasi function 10s):
// premium tier tadinya draft -> critic -> final (3 sequential LLM call).
// Draft & critic sekarang digabung jadi SATU call (model diminta bikin
// jawaban lalu langsung kritik draft-nya sendiri dalam satu response
// terstruktur), sehingga premium tier jadi 2 sequential call saja
// (draftCritic -> final). Pemisahnya pakai delimiter tetap supaya
// gampang di-parse tanpa perlu strict JSON mode.

export const DRAFT_DELIMITER = "===DRAFT===";
export const CRITIQUE_DELIMITER = "===KRITIK===";

export function buildDraftCriticPrompt(query: string): string {
  return `Kamu akan menjawab pertanyaan siswa dalam DUA bagian pada satu response.

PERTANYAAN SISWA:
${query}

BAGIAN 1 — DRAFT JAWABAN:
Tulis draft jawaban lengkap untuk pertanyaan di atas.

BAGIAN 2 — KRITIK DIRI:
Sebagai reviewer akademik yang ketat, periksa draft yang baru kamu tulis:
1. Apakah ada kesalahan faktual atau perhitungan?
2. Apakah ada langkah yang kurang jelas atau membingungkan?
3. Apakah ada bagian yang bisa disederhanakan?
Jika draft sudah baik tanpa masalah berarti, katakan demikian secara singkat.

FORMAT RESPONSE WAJIB PERSIS SEPERTI INI (termasuk baris delimiter):
${DRAFT_DELIMITER}
<isi draft jawaban di sini>
${CRITIQUE_DELIMITER}
<isi kritik di sini>`;
}

export function parseDraftCriticResponse(raw: string): {
  draft: string;
  critique: string;
} {
  const draftIndex = raw.indexOf(DRAFT_DELIMITER);
  const critiqueIndex = raw.indexOf(CRITIQUE_DELIMITER);

  // Fallback: kalau model tidak ikuti format delimiter persis, anggap
  // seluruh response sebagai draft dan kosongkan kritik — lebih aman
  // daripada throw, supaya user tetap dapat jawaban.
  if (draftIndex === -1 || critiqueIndex === -1 || critiqueIndex < draftIndex) {
    return { draft: raw.trim(), critique: "" };
  }

  const draft = raw.slice(draftIndex + DRAFT_DELIMITER.length, critiqueIndex).trim();
  const critique = raw.slice(critiqueIndex + CRITIQUE_DELIMITER.length).trim();

  return { draft, critique };
}
