// src/models/user.model.ts
// FIX: Document harus dikasih generic type parameter <string> supaya _id: string
// gak konflik dengan default ObjectId dari Mongoose.
// Doc: mongoose.Document<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals, TSchema, TStaticsAndMethods>
// Tapi yang paling clean: Document<string> → set _id type di generic.

import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document<string> {
  // <-- FIX: generic <string>
  _id: string; // Supabase UID
  email: string;
  tier: "free" | "premium";
  jenjang?: "smp" | "sma" | "kuliah";
  premiumExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    tier: { type: String, enum: ["free", "premium"], default: "free" },
    jenjang: { type: String, enum: ["smp", "sma", "kuliah"] },
    premiumExpiresAt: { type: Date, default: null },
  },
  { timestamps: true, _id: false },
);

export const User = mongoose.model<IUser>("User", UserSchema);
