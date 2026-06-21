// src/controllers/conversation.controller.ts
// FIX: Express 5 req.params values bertipe string | string[], harus di-extract
// eksplisit. Pakai helper extractParam() untuk handle ini secara konsisten
// di seluruh controller tanpa cast manual tiap baris.

import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import type { TieredRequest } from "../middlewares/userTier.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as conversationService from "../modules/conversation/conversation.service.js";
import { Conversation } from "../models/conversation.model.js";
import { FeedbackLog } from "../models/feedbackLog.model.js";
import { Message } from "../models/message.model.js";
import { logger } from "../utils/logger.js";

// FIX helper — Express 5 params bisa string | string[], ambil yang pertama
function extractParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

// GET /conversations — list semua conversation milik user
export const listConversations = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const conversations =
      await conversationService.listConversationsByUser(userId);
    res.json({ conversations });
  },
);

// GET /conversations/:id — detail 1 conversation + messages
export const getConversation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const conversationId = extractParam(req.params["id"]); // FIX

    const result = await conversationService.getConversationById(
      conversationId,
      userId,
    );

    if (!result) {
      res.status(404).json({ error: "Conversation tidak ditemukan" });
      return;
    }

    res.json(result);
  },
);

// DELETE /conversations/:id
export const deleteConversation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const conversationId = extractParam(req.params["id"]); // FIX

    const deleted = await conversationService.deleteConversation(
      conversationId,
      userId,
    );

    if (!deleted) {
      res.status(404).json({ error: "Conversation tidak ditemukan" });
      return;
    }

    res.json({ message: "Conversation berhasil dihapus" });
  },
);

// POST /conversations/:id/feedback — submit feedback jawaban salah
export const submitFeedback = asyncHandler(
  async (req: TieredRequest, res: Response) => {
    const userId = req.user!.id;
    const conversationId = extractParam(req.params["id"]); // FIX
    const { message_id, feedback_type } = req.body as {
      message_id: string;
      feedback_type: "wrong_answer" | "incomplete" | "off_topic";
    };

    // Ambil data message untuk queryText & responseText
    const message = await Message.findById(message_id);
    if (!message || message.userId !== userId) {
      res.status(404).json({ error: "Message tidak ditemukan" });
      return;
    }

    // Ambil subjectTag/jenjangTag dari conversation (bukan hardcode)
    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation || conversation.userId !== userId) {
      res.status(404).json({ error: "Conversation tidak ditemukan" });
      return;
    }

    await FeedbackLog.create({
      userId,
      messageId: message._id,
      conversationId,
      queryText: message.role === "assistant" ? "" : message.content,
      responseText: message.content,
      subjectTag: conversation.subject,
      jenjangTag: conversation.jenjang,
      feedbackType: feedback_type,
      reviewed: false,
    });

    logger.info(
      `[Feedback] User ${userId} submit feedback "${feedback_type}" untuk message ${message_id}`,
    );

    res.json({ message: "Feedback berhasil disimpan. Terima kasih!" });
  },
);
