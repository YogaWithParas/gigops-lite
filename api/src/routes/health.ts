import { Router } from "express";
import { config } from "../config";
import { sendSuccess } from "../lib/response";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  return sendSuccess(res, {
    status: "ok",
    service: config.serviceName,
    timestamp: new Date().toISOString(),
  });
});
