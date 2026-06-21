// Section 5 planning — content filter & abuse protection.
// Minimal untuk MVP; ditambah seiring data dari feedback_logs & usage_logs.

export const ABUSE_KEYWORDS: string[] = [
  "ignore previous instructions",
  "abaikan instruksi sebelumnya",
  "ignore all previous",
  "system prompt",
  "jailbreak",
  "kamu sekarang adalah",
  "you are now",
  "pretend you are",
  "developer mode",
  "DAN mode",
];

export const SUSPICIOUS_URL_PATTERN =
  /\b(bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly)\/\S+/gi;

// Keyword berbahaya untuk output filter (Section 5 — basic output filter)
export const HARMFUL_OUTPUT_KEYWORDS: string[] = [
  "cara membuat bom",
  "cara membuat senjata",
  "cara meracuni",
];

// Minimal panjang output LLM yang dianggap valid
export const MIN_VALID_OUTPUT_LENGTH = 10;

export const RATE_LIMIT_DEFAULTS = {
  WINDOW_MS: 15 * 60 * 1000,
  MAX_FREE: 10,
  MAX_PREMIUM: 50,
} as const;
