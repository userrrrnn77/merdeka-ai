// src/modules/user/auth.service.ts
// Section 13B planning: Supabase HANYA untuk auth, MongoDB tetap primary
// DB. Auto-provisioning dokumen User di MongoDB sebenarnya sudah di-handle
// di auth.middleware.ts (saat token diverifikasi). Service ini menyediakan
// fungsi register/login eksplisit untuk endpoint auth (kalau FE memang
// memilih hit backend untuk auth daripada langsung ke Supabase SDK client
// side — opsional, karena Section 13B flow utamanya FE -> Supabase SDK
// langsung, backend hanya verifikasi token).

import { createClient } from "@supabase/supabase-js";
import { env } from "../../config/env.js";
import { User } from "../../models/user.model.js";
import { logger } from "../../utils/logger.js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

export async function registerUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user || !data.session) {
    logger.warn(`[Auth] Registrasi gagal untuk ${email}: ${error?.message}`);
    throw new Error(error?.message ?? "Registrasi gagal");
  }

  await User.findByIdAndUpdate(
    data.user.id,
    { $setOnInsert: { _id: data.user.id, email } },
    { upsert: true, new: true },
  );

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    userId: data.user.id,
    email: data.user.email ?? email,
  };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    logger.warn(`[Auth] Login gagal untuk ${email}: ${error?.message}`);
    throw new Error(error?.message ?? "Email atau password salah");
  }

  // Auto-provision jika dokumen belum ada (defensive — middleware juga
  // melakukan ini, tapi tidak ada salahnya di sini juga untuk endpoint
  // login langsung).
  await User.findByIdAndUpdate(
    data.user.id,
    { $setOnInsert: { _id: data.user.id, email } },
    { upsert: true, new: true },
  );

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    userId: data.user.id,
    email: data.user.email ?? email,
  };
}

export async function logoutUser(accessToken: string): Promise<void> {
  const { error } = await supabase.auth.admin.signOut(accessToken);
  if (error) {
    logger.warn(`[Auth] Logout gagal: ${error.message}`);
  }
}
