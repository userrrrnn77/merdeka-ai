// src/modules/ai/prompts/finalizer.prompt.ts

export function buildFinalizerPrompt(
  query: string,
  draftAnswer: string,
  criticNotes: string,
): string {
  return `Kamu bertugas menghasilkan jawaban final terbaik untuk siswa, berdasarkan draft jawaban dan catatan kritik berikut.

PERTANYAAN SISWA:
${query}

DRAFT JAWABAN:
${draftAnswer}

CATATAN KRITIK:
${criticNotes}

Tulis ulang jawaban final yang sudah memperbaiki masalah dari catatan kritik (jika ada), tetap dengan tone dan format yang sesuai system prompt. Jangan menyebut proses review ini ke siswa — langsung berikan jawaban final yang bersih.`;
}
