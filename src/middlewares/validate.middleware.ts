// src/middlewares/validate.middleware.ts
// Zod sebagai validator request body — wajib dipakai di semua endpoint
// tanpa pengecualian (Section 18 — MVP Security Baseline).

import type { Request, Response, NextFunction } from "express";
import { z, type ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Request body tidak valid",
        details: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

// ===== Shared schemas =====

export const chatRequestSchema = z.object({
  query: z
    .string()
    .min(1, "Query tidak boleh kosong")
    .max(4000, "Query terlalu panjang"),
  conversation_id: z.string().optional(),
  client_message_id: z.string().min(1, "client_message_id wajib diisi"),
  subject: z.string().optional(),
  jenjang: z.enum(["smp", "sma", "kuliah"]).optional(),
});

export const feedbackRequestSchema = z.object({
  message_id: z.string().min(1),
  conversation_id: z.string().min(1),
  feedback_type: z.enum(["wrong_answer", "incomplete", "off_topic"]),
});

export const createConversationSchema = z.object({
  subject: z.string().min(1, "Subject wajib diisi"),
  jenjang: z.enum(["smp", "sma", "kuliah"]),
});
