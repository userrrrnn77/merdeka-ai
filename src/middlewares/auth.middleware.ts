// src/middlewares/auth.middleware.ts
// Section 13B & 18 planning: verifikasi token via supabase.auth.getUser(token),
// BUKAN manual JWT verify dengan secret. Cara ini handle JWT rotation
// otomatis jika terjadi breach di Supabase.

import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import { logger } from "../utils/logger.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized — token tidak ditemukan" });
      return;
    }

    const token = authHeader.slice("Bearer ".length);

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: "Unauthorized — token tidak valid" });
      return;
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? "",
    };

    // Auto-provision dokumen User di MongoDB jika belum ada
    // (sesuai Section 13B: saat user pertama kali login/register).
    await User.findByIdAndUpdate(
      data.user.id,
      { $setOnInsert: { _id: data.user.id, email: data.user.email ?? "" } },
      { upsert: true, new: true },
    );

    next();
  } catch (error) {
    logger.error(
      `[Auth] Error saat verifikasi token: ${(error as Error).message}`,
    );
    res.status(500).json({ error: "Internal server error saat autentikasi" });
  }
}
