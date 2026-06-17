import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/errors";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, "NOT_FOUND", "Endpoint not found"));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const requestId = (res.locals.requestId as string | undefined) ?? "unknown";

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      requestId,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      requestId,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.flatten(),
      },
    });
  }

  return res.status(500).json({
    requestId,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
}
