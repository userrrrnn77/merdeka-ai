// src/services/storage.service.ts
// Section 8 & 8A planning: wrapper Cloudflare R2 via presigned URL.
// Fitur gambar sendiri OPSIONAL/FUTURE (belum aktif di MVP), tapi
// MIME validation WAJIB disiapkan dari awal sebelum presigned URL
// generation diaktifkan — cegah upload executable/phishing page ke
// bucket yang punya public URL.

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  r2Client,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_FILE_SIZE_BYTES,
} from "../config/cloudflare.js";
import { logger } from "../utils/logger.js";

const PRESIGNED_URL_EXPIRY_SECONDS = 300; // 5 menit

export interface PresignedUploadResult {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
}

/**
 * Validasi MIME type & ukuran SEBELUM generate presigned URL.
 * Section 8A — WAJIB dipanggil di controller sebelum requestPresignedUpload().
 */
export function validateUploadRequest(
  mimeType: string,
  fileSizeBytes: number,
): { valid: boolean; reason?: string } {
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(mimeType as any)) {
    return {
      valid: false,
      reason: `Tipe file "${mimeType}" tidak diizinkan. Hanya: ${ALLOWED_UPLOAD_MIME_TYPES.join(", ")}`,
    };
  }

  if (fileSizeBytes > MAX_UPLOAD_FILE_SIZE_BYTES) {
    return {
      valid: false,
      reason: `Ukuran file melebihi batas maksimal ${MAX_UPLOAD_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

function buildObjectKey(userId: string, mimeType: string): string {
  const ext = mimeType.split("/")[1] ?? "bin";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `uploads/${userId}/${timestamp}-${random}.${ext}`;
}

/**
 * Generate presigned URL untuk upload langsung ke R2 dari client
 * (Section 8 — serverless function tidak perlu handle upload file
 * langsung; FE upload langsung ke R2 via URL ini).
 */
export async function requestPresignedUpload(
  userId: string,
  mimeType: string,
  fileSizeBytes: number,
): Promise<PresignedUploadResult> {
  const validation = validateUploadRequest(mimeType, fileSizeBytes);

  if (!validation.valid) {
    throw new Error(validation.reason ?? "Validasi upload gagal");
  }

  const objectKey = buildObjectKey(userId, mimeType);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    ContentType: mimeType,
    ContentLength: fileSizeBytes,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
  });

  const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${objectKey}` : "";

  logger.info(
    `[Storage] Presigned URL dibuat untuk user ${userId}: ${objectKey}`,
  );

  return { uploadUrl, objectKey, publicUrl };
}
