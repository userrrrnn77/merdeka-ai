// src/config/db.ts

import mongoose, { type Mongoose } from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const DB_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 20,
  socketTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
};

declare global {
  var __mongoose:
    | { conn: Mongoose | null; promise: Promise<Mongoose> | null }
    | undefined;
}

let cached = global.__mongoose;
if (!cached) {
  cached = global.__mongoose = { conn: null, promise: null };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(uri: string, attempt = 1): Promise<Mongoose> {
  try {
    const conn = await mongoose.connect(uri, DB_OPTIONS);
    logger.info(
      `[DB] MongoDB terhubung — Host: ${conn.connection.host}, DB: ${conn.connection.name}`,
    );
    return conn;
  } catch (error) {
    const message = (error as Error).message;

    if (attempt >= MAX_RETRIES) {
      logger.error(
        `[DB] Gagal koneksi setelah ${MAX_RETRIES} percobaan. Error terakhir: ${message}`,
      );
      throw error;
    }

    const delay = RETRY_DELAY_MS * Math.pow(1.5, attempt - 1);
    logger.warn(
      `[DB] Koneksi gagal (attempt ${attempt}/${MAX_RETRIES}): ${message}. ` +
        `Retry dalam ${Math.round(delay)}ms...`,
    );

    await wait(delay);
    return connectWithRetry(uri, attempt + 1);
  }
}

const connectDB = async (): Promise<Mongoose> => {
  // Sudah terkoneksi
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = connectWithRetry(env.MONGODB_URI);
  }

  try {
    cached!.conn = await cached!.promise;
    return cached!.conn;
  } catch (error) {
    cached!.promise = null;
    throw error;
  }
};

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`[DB] Menerima signal ${signal}, menutup koneksi MongoDB...`);

  try {
    await mongoose.connection.close();
    logger.info("[DB] Koneksi MongoDB ditutup dengan bersih.");
  } catch (error) {
    logger.error(
      `[DB] Error saat menutup koneksi: ${(error as Error).message}`,
    );
  } finally {
    process.exit(0);
  }
}

process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));

mongoose.connection.on("disconnected", () => {
  logger.warn("[DB] MongoDB disconnected.");
});

mongoose.connection.on("reconnected", () => {
  logger.info("[DB] MongoDB reconnected.");
});

mongoose.connection.on("error", (err) => {
  logger.error(`[DB] MongoDB connection error: ${err.message}`);
});

export default connectDB;
