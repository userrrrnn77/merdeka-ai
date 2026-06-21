// src/models/feedbackLog.model.ts
// Section 9A planning: AI accuracy mechanism. Tombol "Jawaban ini
// sepertinya salah" di FE menulis ke collection ini.

import mongoose, { Schema, type Document } from "mongoose";

export type FeedbackType = "wrong_answer" | "incomplete" | "off_topic";

export interface IFeedbackLog extends Document {
  userId: string;
  messageId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  queryText: string;
  responseText: string;
  subjectTag: string;
  jenjangTag: string;
  feedbackType: FeedbackType;
  reviewed: boolean;
  createdAt: Date;
}

const FeedbackLogSchema = new Schema<IFeedbackLog>({
  userId: { type: String, required: true, index: true },
  messageId: { type: Schema.Types.ObjectId, ref: "Message", required: true },
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  queryText: { type: String, required: true },
  responseText: { type: String, required: true },
  subjectTag: { type: String, required: true, index: true },
  jenjangTag: { type: String, required: true },
  feedbackType: {
    type: String,
    enum: ["wrong_answer", "incomplete", "off_topic"],
    required: true,
  },
  reviewed: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const FeedbackLog = mongoose.model<IFeedbackLog>(
  "FeedbackLog",
  FeedbackLogSchema,
);
