import type { Subject, Jenjang } from "../constants/subjects.js";
import type { UIBlockSchema } from "./uiBlock.types.js"; // FIX: dari uiBlock.types, bukan constants/uiBlocks

export interface PipelineContext {
  userId: string;
  conversationId: string;
  clientMessageId: string;
  query: string;
  subject: Subject;
  jenjang: Jenjang;
  isFollowUpMessage: boolean;
  hasUserLearningContext: boolean;
  userProfileInjected: boolean;
}

export interface RAGChunk {
  chunkId: string;
  text: string;
  score: number;
  sourceTier: 1 | 2 | 3;
  sourceWeight: number;
  sourceTitle: string;
}

export interface RAGResult {
  chunks: RAGChunk[];
  ragMiss: boolean;
}

export interface SemanticCacheResult {
  hit: boolean;
  responseText?: string;
  cacheId?: string;
}

export interface LLMGenerationResult {
  text: string;
  tokensUsed: number;
  latencyMs: number;
  modelUsed: string;
}

export interface PipelineFinalResult {
  responseText: string;
  uiBlock: UIBlockSchema | null;
  tokensUsed: number;
  latencyMs: number;
  modelUsed: string;
  cacheHit: boolean;
  ragMiss: boolean;
}

export type PipelineTier = "free" | "premium";
