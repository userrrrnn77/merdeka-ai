// src/models/userLearningLog.model.ts
// Section 2 planning: ini fondasi moat jangka panjang produk.
// Menyimpan history belajar, topik, hasil — data yang makin
// susah ditiru kompetitor seiring waktu.

import mongoose, { Schema, type Document } from "mongoose";

export interface IUserLearningLog extends Document {
  userId: string;
  subject: string;
  jenjang: string;
  topic: string; // contoh: "trigonometri", "hukum-newton"
  conversationId: mongoose.Types.ObjectId;
  messageId: mongoose.Types.ObjectId;
  outcome: "answered" | "quiz_correct" | "quiz_incorrect" | "feedback_wrong";
  createdAt: Date;
}

const UserLearningLogSchema = new Schema<IUserLearningLog>(
  {
    userId: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    jenjang: { type: String, required: true },
    topic: { type: String, required: true, index: true },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    messageId: { type: Schema.Types.ObjectId, ref: "Message", required: true },
    outcome: {
      type: String,
      enum: ["answered", "quiz_correct", "quiz_incorrect", "feedback_wrong"],
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

UserLearningLogSchema.index({ userId: 1, subject: 1, topic: 1 });

export const UserLearningLog = mongoose.model<IUserLearningLog>(
  "UserLearningLog",
  UserLearningLogSchema,
);
