// src/models/cachedResponse.model.ts
// Section 6 planning: semantic cache. TTL index WAJIB — tanpa ini
// storage MongoDB Atlas M0 (512MB) bisa penuh karena cache tumbuh
// tanpa batas.

import mongoose, { Schema, type Document } from "mongoose";

export interface ICachedResponse extends Document {
  queryOriginal: string;
  vectorRefId: string; // point ID di Qdrant collection semantic_cache
  responseFinal: string;
  hitCount: number;
  subjectTag: string;
  jenjangTag: string;
  createdAt: Date;
  lastHitAt: Date;
}

const CachedResponseSchema = new Schema<ICachedResponse>({
  queryOriginal: { type: String, required: true },
  vectorRefId: { type: String, required: true, unique: true, index: true },
  responseFinal: { type: String, required: true },
  hitCount: { type: Number, default: 0 },
  subjectTag: { type: String, required: true, index: true },
  jenjangTag: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastHitAt: { type: Date, default: Date.now },
});

// TTL index WAJIB — dokumen otomatis terhapus 90 hari setelah created_at.
CachedResponseSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

export const CachedResponse = mongoose.model<ICachedResponse>(
  "CachedResponse",
  CachedResponseSchema,
);
