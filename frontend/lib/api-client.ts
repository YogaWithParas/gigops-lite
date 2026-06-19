import { tasks as mockTasks } from "@/lib/gig-data"
import type { JobBatch, TaskItem } from "@/lib/types"

type JobsApiResponse = {
  jobs?: unknown
  data?: unknown
}

type TasksApiResponse = {
  tasks?: unknown
  data?: unknown
}

function getApiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (!value) return null
  return value.replace(/\/$/, "")
}

function toList(payload: { jobs?: unknown; tasks?: unknown; data?: unknown }) {
  if (Array.isArray(payload.jobs)) return payload.jobs
  if (Array.isArray(payload.tasks)) return payload.tasks
  if (Array.isArray(payload.data)) return payload.data
  return []
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
  const list = toList(payload)

  return list.map(toJobBatch).filter((job): job is JobBatch => Boolean(job))
}

function toTaskItem(input: unknown): TaskItem | null {
  if (!input || typeof input !== "object") return null

  const source = input as Partial<TaskItem> & {
    id?: string
    jobId?: string
    title?: string
    type?: "cx" | "data-labeling"
    priority?: "low" | "normal" | "high" | "urgent"
    status?: TaskItem["status"]
    assignedAgentId?: string
  }

  if (!source.id || !source.jobId || !source.title || !source.priority || !source.status || !source.createdAt) {
    return null
  }

  const fallback = mockTasks.find((task) => task.id === source.id)
  const assignedWorkerId =
    typeof source.assignedWorkerId === "string"
      ? source.assignedWorkerId
      : typeof source.assignedAgentId === "string"
        ? source.assignedAgentId
        : fallback?.assignedWorkerId

  return {
    id: source.id,
    jobId: source.jobId,
    title: source.title,
    type: source.type ?? fallback?.type ?? "cx",
    priority: source.priority,
    status: source.status,
    requiredSkills: Array.isArray(source.requiredSkills) ? source.requiredSkills : fallback?.requiredSkills ?? [],
    estimatedMinutes:
      typeof source.estimatedMinutes === "number" ? source.estimatedMinutes : fallback?.estimatedMinutes ?? 0,
    assignedWorkerId,
    qaReviewer: typeof source.qaReviewer === "string" ? source.qaReviewer : fallback?.qaReviewer,
    qualityScore:
      typeof source.qualityScore === "number" ? source.qualityScore : fallback?.qualityScore,
    payoutAmount: typeof source.payoutAmount === "number" ? source.payoutAmount : fallback?.payoutAmount ?? 0,
    dueAt: typeof source.dueAt === "string" ? source.dueAt : fallback?.dueAt ?? source.createdAt,
    createdAt: source.createdAt,
    notes:
      typeof source.notes === "string"
        ? source.notes
        : fallback?.notes ?? "Loaded from standalone backend. Additional task details are synthetic defaults in frontend.",
  }
}

export async function getTasks(): Promise<TaskItem[]> {
  const apiBaseUrl = getApiBaseUrl()
  const url = apiBaseUrl ? `${apiBaseUrl}/tasks?page=1&limit=100` : "/api/tasks"

  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Failed to fetch tasks from ${url} (${response.status})`)
  }

  const payload = (await response.json()) as TasksApiResponse
  const list = toList(payload)

  return list.map(toTaskItem).filter((task): task is TaskItem => Boolean(task))
}
