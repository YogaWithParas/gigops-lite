import { Router } from "express";
import { z } from "zod";
import { agents, tasks, updateTaskAssignment, updateTaskStatus } from "../data/synthetic";
import { ApiError } from "../lib/errors";
import { paginate, parsePagination } from "../lib/pagination";
import { sendSuccess } from "../lib/response";

const assignTaskSchema = z.object({
  agentId: z.string().min(1).nullable(),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(["in_review", "approved", "correction_needed", "escalated"]),
});

export const tasksRouter = Router();

function canMoveToStatus(
  task: (typeof tasks)[number],
  nextStatus: "in_review" | "approved" | "correction_needed" | "escalated",
) {
  const hasAssignment = Boolean(task.assignedAgentId);

  switch (nextStatus) {
    case "in_review":
      return hasAssignment && (task.status === "assigned" || task.status === "correction_needed" || task.status === "escalated");
    case "approved":
      return hasAssignment && (task.status === "assigned" || task.status === "in_review");
    case "correction_needed":
      return hasAssignment && (task.status === "assigned" || task.status === "in_review");
    case "escalated":
      return hasAssignment && (task.status === "assigned" || task.status === "in_review" || task.status === "correction_needed");
    default:
      return false;
  }
}

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

tasksRouter.post("/tasks/:id/status", (req, res) => {
  const taskId = req.params.id;
  const parsed = updateTaskStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid POST /tasks/:id/status payload", parsed.error.flatten());
  }

  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    throw new ApiError(404, "TASK_NOT_FOUND", `Task ${taskId} was not found`);
  }

  if (!canMoveToStatus(task, parsed.data.status)) {
    throw new ApiError(400, "INVALID_TASK_STATUS_TRANSITION", `Task ${task.id} cannot move from ${task.status} to ${parsed.data.status}`);
  }

  const updated = updateTaskStatus(taskId, parsed.data.status);
  if (!updated) {
    throw new ApiError(404, "TASK_NOT_FOUND", `Task ${taskId} was not found`);
  }

  return sendSuccess(res, updated);
});
