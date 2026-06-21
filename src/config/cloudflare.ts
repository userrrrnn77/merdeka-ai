// src/config/cloudflare.ts
// Cloudflare R2 dipakai untuk storage file user (fitur gambar, opsional/future
// — lihat Section 8 & 8A planning). R2 S3-compatible, jadi pakai AWS SDK biasa.

import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET_NAME = env.R2_BUCKET_NAME;
export const R2_PUBLIC_URL = env.R2_PUBLIC_URL;

// Section 8A — backlog, tapi konstanta disiapkan dari awal supaya
// storage.service.ts tinggal pakai begitu fitur gambar diaktifkan.
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
