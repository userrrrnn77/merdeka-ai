// src/modules/conversation/message.service.ts
// Section 4B planning: idempotency via client_message_id. BE cek apakah
// client_message_id sudah ada di messages -> jika ada, return existing
// tanpa re-process LLM. Ini fungsi paling kritikal untuk cegah double
// billing token & duplikat di DB saat retry/koneksi putus.

import { Message, type IMessage } from "../../models/message.model.js";
import { UserLearningLog } from "../../models/userLearningLog.model.js";
import { UsageLog } from "../../models/usageLog.model.js";
import type { UIBlockSchema } from "../../types/uiBlock.types.js";
import { logger } from "../../utils/logger.js";

/**
 * WAJIB dipanggil paling awal di controller chat, SEBELUM masuk ke
 * pipeline AI. Kalau return non-null, controller harus langsung
 * return response existing tanpa panggil runPipeline() sama sekali.
 */
export async function findExistingMessageByClientId(
  clientMessageId: string,
): Promise<IMessage | null> {
  return Message.findOne({ clientMessageId });
}

export async function saveUserMessage(params: {
  conversationId: string;
  userId: string;
  content: string;
  clientMessageId: string;
}): Promise<IMessage> {
  // findOneAndUpdate dengan upsert sebagai extra safety net terhadap race
  // condition (dua request nyaris bersamaan dengan client_message_id
  // sama) — unique index di schema tetap garis pertahanan utama.
  try {
    return await Message.create({
      conversationId: params.conversationId,
      userId: params.userId,
      role: "user",
      content: params.content,
      clientMessageId: params.clientMessageId,
    });
  } catch (error) {
    // Duplicate key error (E11000) -> sudah ada, ambil yang existing
    const existing = await Message.findOne({
      clientMessageId: params.clientMessageId,
    });
    if (existing) return existing;
    throw error;
  }
}

export async function saveAssistantMessage(params: {
  conversationId: string;
  userId: string;
  content: string;
  clientMessageId: string; // clientMessageId pesan USER yang dijawab, dengan suffix agar tetap unik
  uiBlock: UIBlockSchema | null;
  tokensUsed: number;
  latencyMs: number;
  modelUsed: string;
  cacheHit: boolean;
  ragMiss: boolean;
}): Promise<IMessage> {
  const assistantClientId = `${params.clientMessageId}-assistant`;

  try {
    return await Message.create({
      conversationId: params.conversationId,
      userId: params.userId,
      role: "assistant",
      content: params.content,
      clientMessageId: assistantClientId,
      uiBlock: params.uiBlock,
      tokensUsed: params.tokensUsed,
      latencyMs: params.latencyMs,
      modelUsed: params.modelUsed,
      cacheHit: params.cacheHit,
      ragMiss: params.ragMiss,
    });
  } catch (error) {
    const existing = await Message.findOne({
      clientMessageId: assistantClientId,
    });
    if (existing) return existing;
    throw error;
  }
}

export async function getMessagesByConversation(
  conversationId: string,
  userId: string,
): Promise<IMessage[]> {
  return Message.find({ conversationId, userId }).sort({ createdAt: 1 }).lean();
}

/**
 * Log usage untuk cost tracking & analytics (Section 9 & 10).
 * Dipanggil bersamaan dengan saveAssistantMessage, fire setelah pipeline
 * selesai (bukan blocking response ke user kalau gagal).
 */
export async function logUsage(params: {
  userId: string;
  tokensUsed: number;
  latencyMs: number;
  cacheHit: boolean;
  ragMiss: boolean;
  modelUsed: string;
  subjectTag: string;
  jenjangTag: string;
  costEst: number;
}): Promise<void> {
  try {
    await UsageLog.create(params);
  } catch (error) {
    logger.warn(
      `[MessageService] Gagal simpan usage_log: ${(error as Error).message}`,
    );
  }
}

/**
 * Catat ke user_learning_logs — fondasi moat jangka panjang (Section 2).
 * Dipanggil setelah assistant message berhasil disimpan.
 */
export async function logLearningActivity(params: {
  userId: string;
  subject: string;
  jenjang: string;
  topic: string;
  conversationId: string;
  messageId: string;
}): Promise<void> {
  try {
    await UserLearningLog.create({
      userId: params.userId,
      subject: params.subject,
      jenjang: params.jenjang,
      topic: params.topic,
      conversationId: params.conversationId,
      messageId: params.messageId,
      outcome: "answered",
    });
  } catch (error) {
    logger.warn(
      `[MessageService] Gagal simpan user_learning_log: ${(error as Error).message}`,
    );
  }
}
