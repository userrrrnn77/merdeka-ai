// src/routes/conversation.routes.ts
// FIX: asyncHandler di sini tidak perlu di-wrap lagi karena controllers
// sudah export nilai hasil asyncHandler() — bukan raw async function.
// Jadi langsung pakai sebagai route handler tanpa wrap ulang.

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  listConversations,
  getConversation,
  deleteConversation,
  submitFeedback,
} from "../controllers/conversation.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", listConversations);
router.get("/:id", getConversation);
router.delete("/:id", deleteConversation);
router.post("/:id/feedback", submitFeedback);

export default router;
