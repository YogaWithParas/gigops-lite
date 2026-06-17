import { Router } from "express";
import { z } from "zod";
import { createSyntheticJob, jobs } from "../data/synthetic";
import { getJobIdempotencyRecord, setJobIdempotencyRecord, buildPayloadSignature } from "../lib/idempotency";
import { paginate, parsePagination } from "../lib/pagination";
import { sendSuccess } from "../lib/response";
import { ApiError } from "../lib/errors";

const createJobSchema = z.object({
  clientName: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["cx", "data-labeling"]),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  taskCount: z.number().int().positive().max(100000).default(10),
});

export const jobsRouter = Router();

jobsRouter.get("/jobs", (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = paginate(jobs, page, limit);

  return sendSuccess(res, result.data, result.meta);
});

jobsRouter.post("/jobs", (req, res) => {
  const idempotencyKey = req.header("Idempotency-Key");
  if (!idempotencyKey || idempotencyKey.trim() === "") {
    throw new ApiError(400, "IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key header is required for POST /jobs");
  }

  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid POST /jobs payload", parsed.error.flatten());
  }

  const payloadSignature = buildPayloadSignature(parsed.data);
  const existing = getJobIdempotencyRecord(idempotencyKey);

  if (existing) {
    if (existing.payloadSignature !== payloadSignature) {
      throw new ApiError(409, "IDEMPOTENCY_KEY_CONFLICT", "Idempotency-Key has already been used with a different payload");
    }

    res.status(200);
    return sendSuccess(res, existing.responseData, { idempotentReplay: true });
  }

  const createdJob = createSyntheticJob(parsed.data);
  setJobIdempotencyRecord(idempotencyKey, payloadSignature, createdJob);

  res.status(201);
  return sendSuccess(res, createdJob, { idempotentReplay: false });
});
