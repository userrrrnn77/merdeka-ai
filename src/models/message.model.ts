// src/models/message.model.ts
// FIX: uiBlock di schema Mongoose typed Schema.Types.Mixed, tapi di interface
// typed object (bukan Record<string,unknown>) supaya compatible dengan UIBlockSchema
// yang discriminated union tanpa index signature.
// Cast ke `object` (bukan `Record<string,unknown>`) → Mongoose Mixed terima object polos.

import mongoose, { Schema, type Document } from "mongoose";

export type MessageRole = "user" | "assistant";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  userId: string;
  role: MessageRole;
  content: string;
  clientMessageId: string;
  uiBlock?: object | null; // <-- FIX: `object` bukan `Record<string,unknown>`, compatible dengan UIBlockSchema union
  tokensUsed?: number;
  latencyMs?: number;
  modelUsed?: string;
  cacheHit?: boolean;
  ragMiss?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    clientMessageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    uiBlock: { type: Schema.Types.Mixed, default: null },
    tokensUsed: { type: Number },
    latencyMs: { type: Number },
    modelUsed: { type: String },
    cacheHit: { type: Boolean, default: false },
    ragMiss: { type: Boolean, default: false },
  },
  { timestamps: true },
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>("Message", MessageSchema);
