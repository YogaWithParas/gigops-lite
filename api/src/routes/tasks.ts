import { Router } from "express";
import { z } from "zod";
import { agents, tasks, updateTaskAssignment } from "../data/synthetic";
import { ApiError } from "../lib/errors";
import { paginate, parsePagination } from "../lib/pagination";
import { sendSuccess } from "../lib/response";

const assignTaskSchema = z.object({
  agentId: z.string().min(1).nullable(),
});

export const tasksRouter = Router();

tasksRouter.get("/tasks", (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = paginate(tasks, page, limit);

  return sendSuccess(res, result.data, result.meta);
});

tasksRouter.post("/tasks/:id/assign", (req, res) => {
  const taskId = req.params.id;
  const parsed = assignTaskSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid POST /tasks/:id/assign payload", parsed.error.flatten());
  }

  if (parsed.data.agentId !== null) {
    const agent = agents.find((item) => item.id === parsed.data.agentId);
    if (!agent) {
      throw new ApiError(404, "AGENT_NOT_FOUND", `Agent ${parsed.data.agentId} was not found`);
    }
  }

  const updated = updateTaskAssignment(taskId, parsed.data.agentId);
  if (!updated) {
    throw new ApiError(404, "TASK_NOT_FOUND", `Task ${taskId} was not found`);
  }

  return sendSuccess(res, updated);
});
