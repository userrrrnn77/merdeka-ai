// src/types/knowledge.types.ts

export type SourceType = "original" | "kemdikbud" | "utbk" | "wikipedia";
export type SourceTier = 1 | 2 | 3;
export type LicenseType = "original" | "cc-by" | "cc-by-sa" | "pending";

export interface KnowledgeChunk {
  chunkId: string;
  text: string;
}

export interface KnowledgeSourceInput {
  source: SourceType;
  sourceTier: SourceTier;
  license: LicenseType;
  sourceWeight: number;
  lang: string;
  title: string;
  slug: string;
  fullText: string;
  subjectTags: string[];
}
