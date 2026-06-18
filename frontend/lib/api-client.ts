import type { JobBatch } from "@/lib/types"

type JobsApiResponse = {
  jobs?: unknown
  data?: unknown
}

function getApiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (!value) return null
  return value.replace(/\/$/, "")
}

function toJobBatch(input: unknown): JobBatch | null {
  if (!input || typeof input !== "object") return null

  const source = input as Partial<JobBatch> & {
    id?: string
    clientName?: string
    title?: string
    type?: "cx" | "data-labeling"
    priority?: "low" | "normal" | "high" | "urgent"
    status?: "draft" | "queued" | "in_progress" | "qa" | "complete" | "paused"
    taskCount?: number
    createdAt?: string
  }

  if (!source.id || !source.clientName || !source.title || !source.type || !source.priority || !source.status || typeof source.taskCount !== "number" || !source.createdAt) {
    return null
  }

  return {
    id: source.id,
    clientName: source.clientName,
    title: source.title,
    type: source.type,
    priority: source.priority,
    status: source.status,
    taskCount: source.taskCount,
    createdAt: source.createdAt,
    completedTaskCount: typeof source.completedTaskCount === "number" ? source.completedTaskCount : 0,
    qaPassRate: typeof source.qaPassRate === "number" ? source.qaPassRate : 0,
    dueDate: typeof source.dueDate === "string" ? source.dueDate : "",
    notes:
      typeof source.notes === "string"
        ? source.notes
        : "Loaded from standalone backend. Additional job details are synthetic defaults in frontend.",
    requiredSkills: Array.isArray(source.requiredSkills) ? source.requiredSkills : [],
  }
}

export async function getJobs(): Promise<JobBatch[]> {
  const apiBaseUrl = getApiBaseUrl()
  const url = apiBaseUrl ? `${apiBaseUrl}/jobs?page=1&limit=100` : "/api/jobs"

  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs from ${url} (${response.status})`)
  }

  const payload = (await response.json()) as JobsApiResponse
  const list = Array.isArray(payload.jobs) ? payload.jobs : Array.isArray(payload.data) ? payload.data : []

  return list.map(toJobBatch).filter((job): job is JobBatch => Boolean(job))
}
