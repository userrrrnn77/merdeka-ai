// src/modules/user/user.service.ts
// CRUD dasar untuk dokumen User di MongoDB. Tier & jenjang user
// disimpan di sini (Section 13B & 9 planning).

import { User, type IUser } from "../../models/user.model.js";
import { logger } from "../../utils/logger.js";

export async function getUserProfile(userId: string): Promise<IUser | null> {
  return User.findById(userId).lean();
}

export async function updateUserJenjang(
  userId: string,
  jenjang: "smp" | "sma" | "kuliah",
): Promise<IUser | null> {
  return User.findByIdAndUpdate(userId, { jenjang }, { new: true }).lean();
}

export async function upgradeToPremium(
  userId: string,
  expiresAt: Date,
): Promise<IUser | null> {
  const updated = await User.findByIdAndUpdate(
    userId,
    { tier: "premium", premiumExpiresAt: expiresAt },
    { new: true },
  ).lean();

  if (updated) {
    logger.info(
      `[User] User ${userId} upgrade ke premium hingga ${expiresAt.toISOString()}`,
    );
  }

  return updated;
}

export async function downgradeToFree(userId: string): Promise<IUser | null> {
  return User.findByIdAndUpdate(
    userId,
    { tier: "free", premiumExpiresAt: null },
    { new: true },
  ).lean();
}

/**
 * Cek apakah tier premium user masih berlaku. Dipakai sebagai
 * defensive check tambahan di luar userTier.middleware.ts (misal
 * dipanggil dari service lain yang butuh validasi tier real-time).
 */
export function isPremiumActive(
  user: Pick<IUser, "tier" | "premiumExpiresAt">,
): boolean {
  if (user.tier !== "premium") return false;
  if (!user.premiumExpiresAt) return true; // premium tanpa expiry (edge case admin grant)
  return user.premiumExpiresAt > new Date();
}
