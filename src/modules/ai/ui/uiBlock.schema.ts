// src/modules/ai/ui/uiBlock.schema.ts
// JSON Schema per tipe UI block — dipakai sebagai responseFormat saat
// minta Cohere generate structured output (bukan teks bebas).
// Cohere chat API mendukung responseFormat: { type: "json_object" }
// dengan instruksi schema di prompt (lihat uiBlock.generator.ts).

import {
  UI_BLOCK_MAX_ITEMS,
  UI_BLOCK_TYPES,
  type UIBlockType,
} from "../../../constants/uiBlocks.js";

export function getUIBlockSchemaDescription(blockType: UIBlockType): string {
  switch (blockType) {
    case UI_BLOCK_TYPES.QUIZ:
      return `{
  "type": "quiz",
  "title": string,
  "questions": [
    {
      "id": string,
      "question": string,
      "options": string[] (2-5 item),
      "correctIndex": number (index ke options),
      "explanation": string
    }
  ] (maksimal ${UI_BLOCK_MAX_ITEMS.quiz} soal)
}`;

    case UI_BLOCK_TYPES.TABLE:
      return `{
  "type": "table",
  "title": string,
  "headers": string[],
  "rows": string[][] (setiap row.length harus sama dengan headers.length, maksimal ${UI_BLOCK_MAX_ITEMS.table} baris)
}`;

    case UI_BLOCK_TYPES.STEP_SOLUTION:
      return `{
  "type": "step_solution",
  "title": string,
  "steps": [
    {
      "id": string,
      "stepNumber": number,
      "description": string,
      "formula": string (opsional, boleh LaTeX),
      "result": string (opsional)
    }
  ] (maksimal ${UI_BLOCK_MAX_ITEMS.step_solution} langkah),
  "finalAnswer": string
}`;

    case UI_BLOCK_TYPES.FLASHCARD:
      return `{
  "type": "flashcard",
  "title": string,
  "cards": [
    { "id": string, "front": string, "back": string }
  ] (maksimal ${UI_BLOCK_MAX_ITEMS.flashcard} kartu)
}`;

    case UI_BLOCK_TYPES.COMPARISON:
      return `{
  "type": "comparison",
  "title": string,
  "itemA": string,
  "itemB": string,
  "aspects": [
    { "aspect": string, "valueA": string, "valueB": string }
  ] (maksimal ${UI_BLOCK_MAX_ITEMS.comparison} aspek)
}`;

    default:
      throw new Error(`Unknown UI block type: ${blockType}`);
  }
}
