export const UI_BLOCK_TYPES = {
  QUIZ: "quiz",
  TABLE: "table",
  STEP_SOLUTION: "step_solution",
  FLASHCARD: "flashcard",
  COMPARISON: "comparison",
} as const;

export type UIBlockType = (typeof UI_BLOCK_TYPES)[keyof typeof UI_BLOCK_TYPES];

// Aktif di MVP — flashcard & comparison disiapkan tapi belum di-trigger
export const ACTIVE_UI_BLOCK_TYPES: UIBlockType[] = [
  UI_BLOCK_TYPES.QUIZ,
  UI_BLOCK_TYPES.TABLE,
  UI_BLOCK_TYPES.STEP_SOLUTION,
];

// Pre-filter keyword hints sebelum panggil classifier (hemat 1 LLM call)
export const UI_BLOCK_TRIGGER_HINTS: Record<UIBlockType, string[]> = {
  [UI_BLOCK_TYPES.QUIZ]: [
    "kuis",
    "quiz",
    "uji",
    "tes",
    "latihan soal",
    "soal latihan",
  ],
  [UI_BLOCK_TYPES.TABLE]: [
    "tabel",
    "table",
    "bandingkan",
    "perbandingan",
    "rangkum dalam",
  ],
  [UI_BLOCK_TYPES.STEP_SOLUTION]: [
    "langkah",
    "step by step",
    "cara mengerjakan",
    "selesaikan",
    "hitung",
    "carilah",
  ],
  [UI_BLOCK_TYPES.FLASHCARD]: ["flashcard", "kartu hafalan"],
  [UI_BLOCK_TYPES.COMPARISON]: ["vs", "dibanding", "perbedaan"],
};

export const UI_BLOCK_MAX_ITEMS: Record<UIBlockType, number> = {
  [UI_BLOCK_TYPES.QUIZ]: 10,
  [UI_BLOCK_TYPES.TABLE]: 20,
  [UI_BLOCK_TYPES.STEP_SOLUTION]: 15,
  [UI_BLOCK_TYPES.FLASHCARD]: 10,
  [UI_BLOCK_TYPES.COMPARISON]: 6,
};
