// src/middlewares/userTier.middleware.ts
// Ambil tier user dari MongoDB dan attach ke request, supaya
// rateLimit.middleware.ts (tieredRateLimiter) dan pipeline AI tahu
// harus pakai jalur free atau premium.

import type { Response, NextFunction } from "express";
import { User } from "../models/user.model.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";
import { logger } from "../utils/logger.js";

export interface TieredRequest extends AuthenticatedRequest {
  userTier?: "free" | "premium";
}

export async function userTierMiddleware(
  req: TieredRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userDoc = await User.findById(req.user.id).select("tier premiumExpiresAt").lean();

    if (!userDoc) {
      req.userTier = "free";
      next();
      return;
    }

    // Cek apakah premium sudah expired
    if (
      userDoc.tier === "premium" &&
      userDoc.premiumExpiresAt &&
      userDoc.premiumExpiresAt < new Date()
    ) {
      req.userTier = "free";
    } else {
      req.userTier = userDoc.tier;
    }

    next();
  } catch (error) {
    logger.error(`[UserTier] Gagal ambil tier user: ${(error as Error).message}`);
    req.userTier = "free"; // fail-safe ke tier paling restrictive
    next();
  }
}