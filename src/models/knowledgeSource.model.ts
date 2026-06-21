// src/models/knowledgeSource.model.ts
// Section 7 planning: knowledge base RAG. Include source_tier & license
// untuk tracking status legal (lihat Section 17 — Legal Risk Register).

import mongoose, { Schema, type Document } from "mongoose";

export interface IKnowledgeChunk {
  chunkId: number;
  text: string;
  vectorRefId?: string; // point ID di Qdrant collection knowledge_chunks
}

export interface IKnowledgeSource extends Document {
  source: "original" | "kemdikbud" | "utbk" | "wikipedia";
  sourceTier: 1 | 2 | 3;
  license: "original" | "cc-by" | "cc-by-sa" | "pending";
  sourceWeight: number;
  lang: string;
  title: string;
  slug: string;
  fullText: string;
  chunks: IKnowledgeChunk[];
  subjectTags: string[];
  fetchedAt: Date;
  lastUpdated: Date;
}

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    chunkId: { type: Number, required: true },
    text: { type: String, required: true },
    vectorRefId: { type: String },
  },
  { _id: false },
);

const KnowledgeSourceSchema = new Schema<IKnowledgeSource>({
  source: {
    type: String,
    enum: ["original", "kemdikbud", "utbk", "wikipedia"],
    required: true,
  },
  sourceTier: { type: Number, enum: [1, 2, 3], required: true },
  license: {
    type: String,
    enum: ["original", "cc-by", "cc-by-sa", "pending"],
    required: true,
  },
  sourceWeight: { type: Number, required: true, default: 1.0 },
  lang: { type: String, default: "id" },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  fullText: { type: String, required: true },
  chunks: { type: [KnowledgeChunkSchema], default: [] },
  subjectTags: { type: [String], index: true },
  fetchedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
});

KnowledgeSourceSchema.index({ subjectTags: 1, sourceTier: 1 });

export const KnowledgeSource = mongoose.model<IKnowledgeSource>(
  "KnowledgeSource",
  KnowledgeSourceSchema,
);
