// src/app.ts

import express from "express";
import helmet from "helmet";
import cors from "cors";
import { createRequire } from "module";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import router from "./routes/index.js";

// FIX: pino-http adalah CJS module yang type-nya tidak callable di ESM/NodeNext.
// createRequire adalah satu-satunya cara yang guaranteed work tanpa type error.
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pinoHttp = require("pino-http") as (options: {
  logger: typeof logger;
}) => express.RequestHandler;

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(pinoHttp({ logger }));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", router);

app.use((_req, res) => {
  res.status(404).json({ error: "Route tidak ditemukan" });
});

app.use(errorMiddleware);

export default app;
