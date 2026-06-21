// src/controllers/chat.controller.ts
// Endpoint utama: POST /api/chat/stream
// Mengikat: idempotency check (Section 4B) -> SSE setup (Section 4A) ->
// pipeline AI (Section 4) -> persist message + usage_log + learning_log ->
// event done dengan remaining_quota.

import type { Response } from "express";
import type { TieredRequest } from "../middlewares/userTier.middleware.js";
import {
  findExistingMessageByClientId,
  saveUserMessage,
  saveAssistantMessage,
  logUsage,
  logLearningActivity,
} from "../modules/conversation/message.service.js";
import {
  createConversation,
  getConversationById,
  setInitialTitleIfNeeded,
  touchLastActivity,
} from "../modules/conversation/conversation.service.js";
import { setupSSEHeaders, streamPipelineResult } from "../modules/ai/stream.js";
import { User } from "../models/user.model.js";
import { env } from "../config/env.js";
import type { ChatRequestBody } from "../types/chat.types.js";
import type { PipelineContext, PipelineTier } from "../types/pipeline.types.js";
import type { Subject, Jenjang } from "../constants/subjects.js";
import { logger } from "../utils/logger.js";

/**
 * Hitung remaining_quota sederhana untuk MVP: berdasarkan jumlah request
 * dalam window rate limit saat ini. Untuk MVP, kita pakai pendekatan
 * kasar (max - count terkini) karena express-rate-limit tidak expose
 * counter dengan mudah ke luar middleware-nya sendiri. Implementasi ini
 * dihitung ulang sederhana via approximation, BUKAN sumber kebenaran
 * billing — cukup untuk tampilan quota di FE (Section 13A: quota
 * display dari event done).
 */
function estimateRemainingQuota(tier: "free" | "premium"): number {
  return tier === "premium" ? env.RATE_LIMIT_MAX_PREMIUM : env.RATE_LIMIT_MAX_FREE;
}

export async function streamChatHandler(
  req: TieredRequest,
  res: Response,
): Promise<void> {
  const userId = req.user!.id;
  const tier: PipelineTier = req.userTier === "premium" ? "premium" : "free";
  const body = req.body as ChatRequestBody;

  // 1. Idempotency check — WAJIB paling awal (Section 4B)
  const existing = await findExistingMessageByClientId(body.client_message_id);
  if (existing) {
    logger.info(
      `[ChatController] client_message_id "${body.client_message_id}" sudah pernah diproses, return existing.`,
    );
    setupSSEHeaders(res);
    res.write(`data: ${JSON.stringify({ chunk: existing.content })}\n\n`);
    if (existing.uiBlock) {
      res.write(`event: ui_block\ndata: ${JSON.stringify({ ui_block: existing.uiBlock })}\n\n`);
    }
    res.write(
      `event: done\ndata: ${JSON.stringify({ remaining_quota: estimateRemainingQuota(tier) })}\n\n`,
    );
    res.end();
    return;
  }

  // 2. Resolve / create conversation. Subject & jenjang di-lock setelah
  // chat pertama (Section 13A) — kalau conversation_id ada, pakai
  // subject/jenjang YANG SUDAH TERSIMPAN, abaikan body.subject/jenjang
  // kalau dikirim ulang (defend-in-depth, FE seharusnya juga tidak kirim).
  let conversationId = body.conversation_id;
  let subject: Subject;
  let jenjang: Jenjang;
  let isFollowUpMessage = false;

  if (conversationId) {
    const conversation = await getConversationById(conversationId, userId);
    if (!conversation) {
      res.status(404).json({ error: "Percakapan tidak ditemukan" });
      return;
    }
    subject = conversation.subject as Subject;
    jenjang = conversation.jenjang as Jenjang;
    isFollowUpMessage = true;
  } else {
    if (!body.subject || !body.jenjang) {
      res.status(400).json({
        error: "subject dan jenjang wajib diisi untuk percakapan baru",
      });
      return;
    }
    const conversation = await createConversation(userId, body.subject, body.jenjang);
    conversationId = String(conversation._id);
    subject = body.subject;
    jenjang = body.jenjang;
  }

  // 3. Simpan pesan user (idempotent via clientMessageId unique index)
  await saveUserMessage({
    conversationId,
    userId,
    content: body.query,
    clientMessageId: body.client_message_id,
  });

  // 4. Cek apakah user punya learning context (moat — Section 2 & cache
  // isolation Section 6). Untuk MVP: anggap ada context personal kalau
  // ini bukan pertanyaan pertama di conversation (follow-up) ATAU user
  // sudah punya learning log untuk subject ini.
  const userDoc = await User.findById(userId).lean();
  const hasUserLearningContext = isFollowUpMessage;

  const pipelineContext: PipelineContext = {
    userId,
    conversationId,
    clientMessageId: body.client_message_id,
    query: body.query,
    subject,
    jenjang,
    isFollowUpMessage,
    hasUserLearningContext,
    userProfileInjected: !!userDoc?.jenjang,
  };

  // 5. Setup SSE & jalankan pipeline + stream
  setupSSEHeaders(res);

  await streamPipelineResult({
    res,
    context: pipelineContext,
    tier,
    remainingQuotaAfter: estimateRemainingQuota(tier),
    onComplete: async (result) => {
      const assistantMessage = await saveAssistantMessage({
        conversationId: conversationId!,
        userId,
        content: result.responseText,
        clientMessageId: body.client_message_id,
        uiBlock: result.uiBlock as never,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        modelUsed: result.modelUsed,
        cacheHit: result.cacheHit,
        ragMiss: result.ragMiss,
      });

      await touchLastActivity(conversationId!);
      await setInitialTitleIfNeeded(conversationId!, subject, body.query);

      await logUsage({
        userId,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        cacheHit: result.cacheHit,
        ragMiss: result.ragMiss,
        modelUsed: result.modelUsed,
        subjectTag: subject,
        jenjangTag: jenjang,
        costEst: result.costEst,
      });

      // topic di sini disederhanakan jadi subject untuk MVP (deteksi
      // topik granular butuh classifier tambahan — backlog Fase 2,
      // lihat Section 15 progress tracking per topik).
      await logLearningActivity({
        userId,
        subject,
        jenjang,
        topic: subject,
        conversationId: conversationId!,
        messageId: String(assistantMessage._id),
      });
    },
  });
}