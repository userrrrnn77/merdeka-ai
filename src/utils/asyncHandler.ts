// src/utils/asyncHandler.ts
// Wrapper supaya tidak perlu try/catch berulang di setiap controller.
// Error otomatis diteruskan ke error.middleware.ts via next(error).

import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler(fn: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}