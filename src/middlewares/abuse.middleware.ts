// src/middlewares/abuse.middleware.ts
// Section 5 planning: content filter & abuse protection. Jalan SEBELUM
// semantic cache dan RAG. Tahap 1-4 (rule-based) di-implementasi di sini;
// Tahap 5 (ML classifier) opsional, masuk modules/filter/intent.classifier.ts
// kalau rule-based dirasa kurang.

import type { Request, Response, NextFunction } from "express";
import { ABUSE_KEYWORDS, SUSPICIOUS_URL_PATTERN } from "../constants/filter.js";
import { logger } from "../utils/logger.js";

function containsAbuseKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return ABUSE_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()));
}

function containsSuspiciousUrl(text: string): boolean {
  return SUSPICIOUS_URL_PATTERN.test(text);
}

// Tahap 4 — deteksi pola request otomatis sederhana: query yang sama
// persis diulang berkali-kali dalam waktu singkat. Untuk MVP, deteksi
// dasar via Map in-memory; upgrade ke Redis kalau perlu shared state
// antar instance (sama seperti rate limit, Section 12C backlog).
const recentQueriesByUser = new Map<string, { query: string; count: number; lastSeen: number }>();
const SPAM_REPEAT_THRESHOLD = 4;
const SPAM_WINDOW_MS = 60_000;

function isLikelySpam(userId: string, query: string): boolean {
  const now = Date.now();
  const entry = recentQueriesByUser.get(userId);

  if (!entry || now - entry.lastSeen > SPAM_WINDOW_MS) {
    recentQueriesByUser.set(userId, { query, count: 1, lastSeen: now });
    return false;
  }

  if (entry.query === query) {
    entry.count += 1;
    entry.lastSeen = now;
    return entry.count >= SPAM_REPEAT_THRESHOLD;
  }

  recentQueriesByUser.set(userId, { query, count: 1, lastSeen: now });
  return false;
}

export function abuseGuardMiddleware(
  req: Request & { user?: { id: string } },
  res: Response,
  next: NextFunction,
): void {
  const query: string | undefined = req.body?.query;

  if (!query) {
    next();
    return;
  }

  // Tahap 3 — Prompt Injection Guard
  if (containsAbuseKeyword(query)) {
    logger.warn(`[Abuse] Prompt injection terdeteksi dari user ${req.user?.id}`);
    res.status(400).json({
      error: "Permintaan tidak dapat diproses. Mohon ajukan pertanyaan seputar materi pelajaran.",
    });
    return;
  }

  // Tahap 2 — Rule-based filter: URL mencurigakan
  if (containsSuspiciousUrl(query)) {
    logger.warn(`[Abuse] URL mencurigakan terdeteksi dari user ${req.user?.id}`);
    res.status(400).json({
      error: "Permintaan mengandung tautan yang tidak diizinkan.",
    });
    return;
  }

  // Tahap 4 — Bot/Spam Detection
  if (req.user?.id && isLikelySpam(req.user.id, query)) {
    logger.warn(`[Abuse] Pola spam terdeteksi dari user ${req.user?.id}`);
    res.status(429).json({
      error: "Terdeteksi pengulangan permintaan yang sama. Mohon tunggu sebentar.",
    });
    return;
  }

  next();
}