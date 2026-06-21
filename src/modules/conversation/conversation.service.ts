// src/modules/conversation/conversation.service.ts
// Section 9 & 13A planning: subject & jenjang di-lock setelah chat
// pertama terkirim (enforce di sini, bukan di schema). title disusun
// otomatis dari subject + topik pertama yang terdeteksi (sederhana
// untuk MVP: subject label + potongan query pertama).

import {
  Conversation,
  type IConversation,
} from "../../models/conversation.model.js";
import {
  SUBJECT_LABELS,
  type Subject,
  type Jenjang,
} from "../../constants/subjects.js";
import { logger } from "../../utils/logger.js";

function buildInitialTitle(subject: Subject, firstQuery: string): string {
  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;
  const trimmedQuery = firstQuery.trim().slice(0, 40);
  return trimmedQuery ? `${subjectLabel} - ${trimmedQuery}` : subjectLabel;
}

export async function createConversation(
  userId: string,
  subject: Subject,
  jenjang: Jenjang,
): Promise<IConversation> {
  const conversation = await Conversation.create({
    userId,
    subject,
    jenjang,
    title: "Percakapan baru",
    lastActivityAt: new Date(),
  });

  logger.info(
    `[Conversation] Conversation baru dibuat: ${conversation._id} (user: ${userId})`,
  );
  return conversation;
}

/**
 * Set title berdasarkan pertanyaan pertama. Dipanggil sekali saja
 * setelah message pertama berhasil diproses (message.service.ts).
 */
export async function setInitialTitleIfNeeded(
  conversationId: string,
  subject: Subject,
  firstQuery: string,
): Promise<void> {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.title !== "Percakapan baru") return;

  conversation.title = buildInitialTitle(subject, firstQuery);
  await conversation.save();
}

export async function touchLastActivity(conversationId: string): Promise<void> {
  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { lastActivityAt: new Date() } },
  );
}

export async function getConversationById(
  conversationId: string,
  userId: string,
): Promise<IConversation | null> {
  return Conversation.findOne({ _id: conversationId, userId });
}

export async function listConversationsByUser(
  userId: string,
  limit = 50,
): Promise<IConversation[]> {
  return Conversation.find({ userId })
    .sort({ lastActivityAt: -1 })
    .limit(limit)
    .lean();
}

export async function deleteConversation(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const result = await Conversation.deleteOne({ _id: conversationId, userId });
  return result.deletedCount > 0;
}
