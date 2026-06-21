import { COHERE_CHAT_MODEL, COHERE_EMBED_MODEL } from "../config/cohere.js";

export const MODELS = {
  CHAT_DEFAULT: COHERE_CHAT_MODEL,
  EMBED_DEFAULT: COHERE_EMBED_MODEL,
  // Lebih ringan/cepat untuk task murah: classifier, intent detection
  CHAT_LIGHT: "command-r-08-2024",
} as const;

// Premium tier: drafter -> critic -> finalizer (Section 4 planning)
// Untuk MVP semua pakai model yang sama — diferensiasi premium ada di
// jumlah pass (draft+kritik+final) bukan model lebih mahal
export const PREMIUM_PIPELINE_MODELS = {
  DRAFTER: MODELS.CHAT_DEFAULT,
  CRITIC: MODELS.CHAT_DEFAULT,
  FINALIZER: MODELS.CHAT_DEFAULT,
} as const;
