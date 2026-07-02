// api/index.ts — Vercel serverless entrypoint
// BEDA dari index.ts (lokal/Render): di sini TIDAK ADA app.listen().
// Vercel invoke handler ini per-request; DB & Qdrant init dibuat lazy
// dan di-cache di module scope supaya warm instance tidak connect ulang.

import connectDB from "../src/config/db.js";
import { initVectorDB } from "../src/config/vectordb.js";
import { logger } from "../src/utils/logger.js";
import app from "../src/app.js";
import type { Request, Response } from "express";

// Cache di module scope — bertahan selama instance masih warm.
let vectorDBReady: Promise<void> | null = null;

async function ensureReady(): Promise<void> {
  await connectDB();

  if (!vectorDBReady) {
    vectorDBReady = initVectorDB().catch((error) => {
      // reset supaya percobaan berikutnya bisa retry, bukan stuck gagal selamanya
      vectorDBReady = null;
      throw error;
    });
  }
  await vectorDBReady;
}

export default async function handler(req: Request, res: Response) {
  try {
    await ensureReady();
  } catch (error) {
    logger.error(`[Vercel] Gagal inisialisasi dependency: ${(error as Error).message}`);
    res.status(503).json({ error: "Service belum siap, coba lagi sebentar." });
    return;
  }

  return app(req, res);
}
