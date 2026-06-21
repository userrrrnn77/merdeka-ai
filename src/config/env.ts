// src/config/env.ts
// Validasi seluruh environment variable saat startup.
// Jika ada yang invalid/kosong, process exit sebelum server jalan
// — lebih baik gagal cepat di awal daripada error random di tengah request.

import "dotenv/config";
import { z } from "zod";

// CATATAN: env.ts TIDAK boleh import logger.ts, karena logger.ts
// sendiri butuh env.ts untuk baca LOG_LEVEL/NODE_ENV (circular dependency).
// Validasi env terjadi paling awal sebelum logger siap, jadi pakai
// console langsung di sini saja.

const envSchema = z.object({
  // APP
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.string().default("info"),

  // MONGODB
  MONGODB_URI: z.string().min(1, "MONGODB_URI wajib diisi"),

  // SUPABASE
  SUPABASE_URL: z.string().url("SUPABASE_URL harus berupa URL valid"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY wajib diisi"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY wajib diisi"),
  SUPABASE_JWT_SECRET: z.string().optional(),

  // QDRANT
  QDRANT_URL: z.string().min(1, "QDRANT_URL wajib diisi"),
  QDRANT_API_KEY: z.string().optional().default(""),

  // CLOUDFLARE R2
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1, "CLOUDFLARE_ACCOUNT_ID wajib diisi"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID wajib diisi"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY wajib diisi"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME wajib diisi"),
  R2_PUBLIC_URL: z.string().optional().default(""),

  // COHERE (chat completion + embedding, full stack)
  COHERE_API_KEY: z.string().min(1, "COHERE_API_KEY wajib diisi"),
  COHERE_BASE_URL: z.string().url().default("https://api.cohere.com"),
  COHERE_CHAT_MODEL: z.string().default("command-r-plus-08-2024"),
  COHERE_EMBED_MODEL: z.string().default("embed-multilingual-v3.0"),

  // RAG
  RAG_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),

  // FRONTEND / CORS
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL wajib diisi"),

  // RATE LIMIT
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX_FREE: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_MAX_PREMIUM: z.coerce.number().int().positive().default(50),

  // SENTRY (opsional, boleh kosong sebelum go-live)
  SENTRY_DSN: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("[ENV] Validasi environment variable gagal:");
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
