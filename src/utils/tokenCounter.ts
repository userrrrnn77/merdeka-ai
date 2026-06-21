// src/utils/tokenCounter.ts
// Estimasi token sebelum kirim ke LLM, dipakai untuk cost tracking
// dasar (usage_logs) dan validasi panjang input sebelum hit API.

const APPROX_CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / APPROX_CHARS_PER_TOKEN);
}

export function estimateMessagesTokens(messages: { content: string }[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
}

// Estimasi cost dasar — angka per-token disesuaikan ke harga Cohere
// command-r-plus saat ini. Update berkala, ini bukan sumber kebenaran
// billing aktual, hanya untuk dashboard internal (Section 10 planning).
const COST_PER_1K_INPUT_TOKENS_USD = 0.0025;
const COST_PER_1K_OUTPUT_TOKENS_USD = 0.01;

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1000) * COST_PER_1K_INPUT_TOKENS_USD;
  const outputCost = (outputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS_USD;
  return Number((inputCost + outputCost).toFixed(6));
}