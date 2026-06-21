// src/routes/index.ts

import { Router } from "express";
import chatRoutes from "./chat.routes.js";
import conversationRoutes from "./conversation.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/chat", chatRoutes);
router.use("/conversations", conversationRoutes);
router.use("/users", userRoutes);

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
