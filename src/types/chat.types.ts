// src/types/chat.types.ts

import type { Subject, Jenjang } from "../constants/subjects.js";

export interface ChatRequestBody {
  query: string;
  conversation_id?: string; // kosong = buat conversation baru
  client_message_id: string;
  subject?: Subject; // wajib diisi hanya saat buat conversation baru
  jenjang?: Jenjang; // wajib diisi hanya saat buat conversation baru
}

// Format event SSE — selaras dengan Section 4A planning
export type SSEEventName = "chunk" | "ui_block" | "done" | "error";

export interface SSEChunkPayload {
  chunk: string;
}

export interface SSEUIBlockPayload {
  ui_block: unknown; // UIBlockSchema, di-stringify saat dikirim
}

export interface SSEDonePayload {
  remaining_quota: number;
  message_id: string;
  conversation_id: string;
}

export interface SSEErrorPayload {
  message: string;
}
