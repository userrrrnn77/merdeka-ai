// src/modules/ai/prompts/drafter.prompt.ts
// Drafter dipakai di free tier (satu-satunya pass) dan di premium tier
// (sebagai draft awal sebelum critic + finalizer, Section 4 planning).

export function buildDrafterUserPrompt(query: string): string {
  return query;
}