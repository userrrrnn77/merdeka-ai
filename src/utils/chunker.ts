// src/utils/chunker.ts
// Pecah teks panjang jadi chunk ~500 token untuk RAG (Section 7 planning).
// Estimasi token pakai heuristik kata (bukan tokenizer presisi) —
// cukup akurat untuk Bahasa Indonesia tanpa dependency tambahan.

const APPROX_CHARS_PER_TOKEN = 4;
const DEFAULT_CHUNK_TOKEN_SIZE = 500;
const DEFAULT_CHUNK_OVERLAP_TOKENS = 50;

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
}

export interface TextChunk {
  chunkId: number;
  text: string;
}

/**
 * Chunking berbasis paragraf dulu (split by \n\n), baru digabung
 * sampai mendekati target token size. Ini menjaga chunk tidak
 * memotong kalimat di tengah secara acak.
 */
export function chunkText(
  fullText: string,
  targetTokenSize: number = DEFAULT_CHUNK_TOKEN_SIZE,
  overlapTokens: number = DEFAULT_CHUNK_OVERLAP_TOKENS,
): TextChunk[] {
  const paragraphs = fullText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let currentTokens = 0;
  let chunkId = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokenCount(paragraph);

    if (currentTokens + paragraphTokens > targetTokenSize && currentChunk) {
      chunks.push({ chunkId: chunkId++, text: currentChunk.trim() });

      // Overlap: ambil ekor chunk sebelumnya sebagai awal chunk baru,
      // supaya konteks tidak putus total di batas chunk.
      const overlapChars = overlapTokens * APPROX_CHARS_PER_TOKEN;
      const tail = currentChunk.slice(-overlapChars);
      currentChunk = tail + "\n\n" + paragraph;
      currentTokens = estimateTokenCount(currentChunk);
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      currentTokens += paragraphTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({ chunkId: chunkId++, text: currentChunk.trim() });
  }

  return chunks;
}
