// index.ts — entry point
// Urutan wajib: connectDB dulu, baru app.listen.
// Kalau dibalik, request bisa masuk sebelum MongoDB siap.

import connectDB from "./src/config/db.js";
import { initVectorDB } from "./src/config/vectordb.js";
import { env } from "./src/config/env.js";
import { logger } from "./src/utils/logger.js";
import app from "./src/app.js";

async function bootstrap() {
  try {
    // 1. MongoDB
    await connectDB();

    // 2. Qdrant — pastikan collection knowledge_chunks & semantic_cache ada
    await initVectorDB();

    // 3. Start server
    const port = env.PORT;
    app.listen(port, () => {
      logger.info(
        `[Server] Berjalan di http://localhost:${port} (${env.NODE_ENV})`,
      );
    });
  } catch (error) {
    logger.error(`[Server] Gagal start: ${(error as Error).message}`);
    process.exit(1);
  }
}

bootstrap();
