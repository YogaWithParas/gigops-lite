import { Router } from "express";
import { auditEvents } from "../data/synthetic";
import { fullListMeta } from "../lib/pagination";
import { sendSuccess } from "../lib/response";

export const auditRouter = Router();

auditRouter.get("/audit", (_req, res) => {
  return sendSuccess(res, auditEvents, fullListMeta(auditEvents.length));
});
