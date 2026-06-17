import type { Response } from "express";

export function sendSuccess<T, M = unknown>(res: Response, data: T, meta?: M) {
  const requestId = res.locals.requestId as string;
  if (meta) {
    return res.json({ requestId, data, meta });
  }

  return res.json({ requestId, data });
}
