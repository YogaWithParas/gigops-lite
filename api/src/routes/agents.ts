import { Router } from "express";
import { agents } from "../data/synthetic";
import { fullListMeta } from "../lib/pagination";
import { sendSuccess } from "../lib/response";

export const agentsRouter = Router();

agentsRouter.get("/agents", (_req, res) => {
  return sendSuccess(res, agents, fullListMeta(agents.length));
});
