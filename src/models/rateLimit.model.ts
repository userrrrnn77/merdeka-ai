// src/models/rateLimit.model.ts
// Section 12A & 12C planning: MVP pakai in-memory store (express-rate-limit
// default). Model ini disiapkan sebagai opsi persist sederhana di MongoDB
// untuk audit/debug, BUKAN pengganti express-rate-limit itu sendiri.
// Upgrade penuh ke Redis (Upstash) ada di backlog Section 12C.

import mongoose, { Schema, type Document } from "mongoose";

export interface IRateLimit extends Document {
  identifier: string; // userId atau IP
  windowStart: Date;
  requestCount: number;
}

const RateLimitSchema = new Schema<IRateLimit>({
  identifier: { type: String, required: true, index: true },
  windowStart: { type: Date, required: true },
  requestCount: { type: Number, default: 0 },
});

RateLimitSchema.index({ identifier: 1, windowStart: 1 }, { unique: true });

// TTL pendek — data rate limit tidak perlu disimpan lama (24 jam cukup
// untuk keperluan audit/debug).
RateLimitSchema.index({ windowStart: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export const RateLimit = mongoose.model<IRateLimit>(
  "RateLimit",
  RateLimitSchema,
);
