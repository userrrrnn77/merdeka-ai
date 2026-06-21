// src/models/usageLog.model.ts
// Section 9 & 10 planning: cost tracking + TTL index 90 hari
// (data lama sudah ter-aggregate di PostHog). rag_miss flag untuk
// analytics gap knowledge base.

import mongoose, { Schema, type Document } from "mongoose";

export interface IUsageLog extends Document {
  userId: string;
  tokensUsed: number;
  latencyMs: number;
  cacheHit: boolean;
  ragMiss: boolean;
  modelUsed: string;
  subjectTag: string;
  jenjangTag: string;
  costEst: number;
  createdAt: Date;
}

const UsageLogSchema = new Schema<IUsageLog>({
  userId: { type: String, required: true, index: true },
  tokensUsed: { type: Number, required: true },
  latencyMs: { type: Number, required: true },
  cacheHit: { type: Boolean, default: false },
  ragMiss: { type: Boolean, default: false },
  modelUsed: { type: String, required: true },
  subjectTag: { type: String, required: true, index: true },
  jenjangTag: { type: String, required: true },
  costEst: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// TTL index WAJIB — 90 hari, sesuai Section 9 planning.
UsageLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

export const UsageLog = mongoose.model<IUsageLog>("UsageLog", UsageLogSchema);
