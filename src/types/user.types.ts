// src/types/user.types.ts

export type UserTier = "free" | "premium";

export interface AuthenticatedUser {
  id: string; // Supabase UID, dipakai juga sebagai _id di MongoDB users
  email: string;
}

export interface UserProfile {
  supabaseId: string;
  email: string;
  tier: UserTier;
  jenjang?: string;
  createdAt: Date;
}