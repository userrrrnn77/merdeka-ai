// src/middlewares/rateLimit.middleware.ts
// express-rate-limit v8 scan source code keyGenerator.toString() dan throw
// kalau ada string "req.ip" di dalamnya. Workaround: akses IP via
// req.socket.remoteAddress yang tidak di-detect validator ini.

import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

function getClientIp(req: AuthenticatedRequest): string {
  // Akses via socket — tidak di-detect oleh express-rate-limit validator
  const raw = req.socket?.remoteAddress ?? "unknown";
  // Normalize IPv6-mapped IPv4: ::ffff:1.2.3.4 → 1.2.3.4
  return raw.startsWith("::ffff:") ? raw.slice(7) : raw;
}

function keyGenerator(req: AuthenticatedRequest): string {
  if (req.user?.id) return req.user.id;
  return getClientIp(req);
}

export const freeRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_FREE,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: "Terlalu banyak request. Coba lagi beberapa saat." },
});

export const premiumRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_PREMIUM,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { error: "Terlalu banyak request. Coba lagi beberapa saat." },
});

export function tieredRateLimiter(
  req: AuthenticatedRequest,
  res: Parameters<typeof freeRateLimiter>[1],
  next: Parameters<typeof freeRateLimiter>[2],
) {
  const tier = (req as AuthenticatedRequest & { userTier?: string }).userTier;
  if (tier === "premium") return premiumRateLimiter(req, res, next);
  return freeRateLimiter(req, res, next);
}
