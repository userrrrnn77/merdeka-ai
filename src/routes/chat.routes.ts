// src/routes/chat.routes.ts

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { userTierMiddleware } from "../middlewares/userTier.middleware.js";
import { tieredRateLimiter } from "../middlewares/rateLimit.middleware.js";
import { abuseGuardMiddleware } from "../middlewares/abuse.middleware.js";
import {
  validateBody,
  chatRequestSchema,
} from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { streamChatHandler } from "../controllers/chat.controller.js";

const router = Router();

// Urutan middleware penting:
// auth -> tier (butuh req.user) -> rate limit (butuh tier) -> validasi
// body -> abuse guard (butuh body.query yang sudah divalidasi) -> handler
router.post(
  "/stream",
  authMiddleware,
  userTierMiddleware,
  tieredRateLimiter,
  validateBody(chatRequestSchema),
  abuseGuardMiddleware,
  asyncHandler(streamChatHandler),
);

export default router;
