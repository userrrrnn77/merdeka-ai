// src/controllers/user.controller.ts

import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { getUserProfile, updateUserJenjang } from "../modules/user/user.service.js";
import { z } from "zod";

const updateJenjangSchema = z.object({
  jenjang: z.enum(["smp", "sma", "kuliah"]),
});

export async function getProfileHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const profile = await getUserProfile(req.user!.id);

  if (!profile) {
    res.status(404).json({ error: "Profil tidak ditemukan" });
    return;
  }

  res.json({ profile });
}

export async function updateProfileHandler(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const body = updateJenjangSchema.parse(req.body);
  const updated = await updateUserJenjang(req.user!.id, body.jenjang);

  if (!updated) {
    res.status(404).json({ error: "Profil tidak ditemukan" });
    return;
  }

  res.json({ profile: updated });
}