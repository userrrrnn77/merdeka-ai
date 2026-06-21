// src/models/conversation.model.ts
// Section 9 & 13A planning: subject/jenjang di-lock setelah chat pertama
// terkirim (di-enforce di service layer, bukan di schema — schema hanya
// menyimpan).

import mongoose, { Schema, type Document } from "mongoose";

export interface IConversation extends Document {
  userId: string;
  subject: string;
  jenjang: string;
  title: string;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    jenjang: { type: String, required: true },
    title: { type: String, default: "Percakapan baru" },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

ConversationSchema.index({ userId: 1, lastActivityAt: -1 });

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema,
);
