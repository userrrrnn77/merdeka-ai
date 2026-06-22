// src/controllers/auth.controller.ts
// Flow Section 13B: FE bisa pilih hit backend ini ATAU langsung ke Supabase SDK.
// Endpoint ini berguna untuk FE yang ingin satu titik komunikasi (semua lewat BE),
// atau untuk kasus di mana FE butuh data user MongoDB (tier, jenjang) sekaligus
// session token dalam satu response.

import type { Request, Response } from "express";
import { z } from "zod";
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../modules/user/auth.service.js";
import { getUserProfile } from "../modules/user/user.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { logger } from "../utils/logger.js";

const authSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

// POST /auth/register
export async function registerHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const body = authSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({
      error: "Input tidak valid",
      details: body.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  try {
    const result = await registerUser(body.data.email, body.data.password);

    // Ambil profil MongoDB sekalian (tier, jenjang) supaya FE dapat
    // info lengkap dalam 1 round-trip
    const profile = await getUserProfile(result.userId);

    logger.info(`[Auth] Register berhasil: ${result.email}`);

    res.status(201).json({
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      user: {
        id: result.userId,
        email: result.email,
        tier: profile?.tier ?? "free",
        jenjang: profile?.jenjang ?? null,
      },
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}

// POST /auth/login
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const body = authSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({
      error: "Input tidak valid",
      details: body.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  try {
    const result = await loginUser(body.data.email, body.data.password);
    const profile = await getUserProfile(result.userId);

    logger.info(`[Auth] Login berhasil: ${result.email}`);

    res.json({
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      user: {
        id: result.userId,
        email: result.email,
        tier: profile?.tier ?? "free",
        jenjang: profile?.jenjang ?? null,
      },
    });
  } catch (error) {
    // Jangan expose detail error Supabase ke client — generic message
    res.status(401).json({ error: "Email atau password salah" });
  }
}

// POST /auth/logout
// Butuh token di header untuk invalidate session di Supabase
export async function logoutHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const token = req.headers.authorization?.slice("Bearer ".length) ?? "";
    await logoutUser(token);
    logger.info(`[Auth] Logout: ${req.user?.id}`);
    res.json({ message: "Logout berhasil" });
  } catch (error) {
    // Logout tetap dianggap sukses dari sisi FE meskipun Supabase error —
    // token di FE akan di-clear terlepas dari response ini
    res.json({ message: "Logout berhasil" });
  }
}

// GET /auth/me
// Dipakai FE untuk validasi session aktif sekaligus dapat data user terbaru
// (tier, jenjang) tanpa perlu call endpoint terpisah
export async function getMeHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const profile = await getUserProfile(req.user!.id);

  res.json({
    user: {
      id: req.user!.id,
      email: req.user!.email,
      tier: profile?.tier ?? "free",
      jenjang: profile?.jenjang ?? null,
    },
  });
}
