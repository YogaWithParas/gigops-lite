import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  const requestId = incoming && incoming.trim().length > 0 ? incoming : randomUUID();

  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
}
