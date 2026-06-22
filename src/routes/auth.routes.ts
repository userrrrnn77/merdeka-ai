// src/routes/auth.routes.ts
// Register & login tidak butuh authMiddleware (belum punya token).
// Logout & /me butuh authMiddleware.

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  registerHandler,
  loginHandler,
  logoutHandler,
  getMeHandler,
} from "../controllers/auth.controller.js";

const router = Router();

// Public — tidak butuh token
router.post("/register", asyncHandler(registerHandler));
router.post("/login", asyncHandler(loginHandler));

// Protected — butuh token
router.post("/logout", authMiddleware, asyncHandler(logoutHandler));
router.get("/me", authMiddleware, asyncHandler(getMeHandler));

export default router;
