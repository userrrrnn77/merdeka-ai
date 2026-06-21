// src/routes/user.routes.ts

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getProfileHandler,
  updateProfileHandler,
} from "../controllers/user.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/me", asyncHandler(getProfileHandler));
router.patch("/me", asyncHandler(updateProfileHandler));

export default router;
