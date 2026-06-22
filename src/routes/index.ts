// src/routes/index.ts

import { Router } from "express";
import chatRoutes from "./chat.routes.js";
import conversationRoutes from "./conversation.routes.js";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

router.use("/chat", chatRoutes);
router.use("/conversations", conversationRoutes);
router.use("/users", userRoutes);
router.use("/auth", authRoutes);

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
