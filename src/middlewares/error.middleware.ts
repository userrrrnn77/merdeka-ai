// src/middlewares/error.middleware.ts
// Global error handler — pasang paling akhir di app.ts (setelah semua
// routes). Menangkap error yang di-pass via next(error), termasuk dari
// asyncHandler wrapper (utils/asyncHandler.ts).

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger.js";

interface HttpError extends Error {
  statusCode?: number;
}

export function errorMiddleware(
  err: HttpError | ZodError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  // Response sudah mulai di-stream (SSE) — jangan coba kirim JSON lagi,
  // cukup log dan tutup koneksi kalau belum ditutup.
  if (res.headersSent) {
    logger.error(
      `[ErrorMiddleware] Error setelah headers terkirim: ${err.message}`,
    );
    if (!res.writableEnded) res.end();
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Request tidak valid",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const statusCode = (err as HttpError).statusCode ?? 500;

  logger.error(
    `[ErrorMiddleware] ${req.method} ${req.path} -> ${statusCode}: ${err.message}`,
  );

  if (statusCode >= 500) {
    // Jangan leak detail internal ke client untuk error 500
    res.status(statusCode).json({
      error: "Terjadi kesalahan pada server. Coba lagi beberapa saat.",
    });
    return;
  }

  res.status(statusCode).json({ error: err.message });
}

/**
 * Helper untuk throw error dengan statusCode tertentu dari mana saja
 * di codebase (controller/service), tertangkap rapi oleh errorMiddleware.
 */
export class HttpException extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpException";
  }
}

/**
 * 404 handler — dipasang sebelum errorMiddleware, setelah semua routes
 * terdaftar, untuk route yang tidak match sama sekali.
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({ error: `Route tidak ditemukan: ${req.method} ${req.path}` });
}