import { auditEvents as mockAuditEvents, gigWorkers as mockWorkers, tasks as mockTasks } from "@/lib/gig-data"
import type { AuditEvent, GigWorker, JobBatch, TaskItem } from "@/lib/types"

type JobsApiResponse = {
  jobs?: unknown
  data?: unknown
}

type TasksApiResponse = {
  tasks?: unknown
  data?: unknown
}

type AgentsApiResponse = {
  agents?: unknown
  data?: unknown
}

type AuditApiResponse = {
  audit?: unknown
  data?: unknown
}

type TaskMutationResponse = {
  task?: unknown
  data?: unknown
  message?: unknown
  error?: {
    message?: unknown
  }
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

function toErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null

  const source = payload as {
    message?: unknown
    error?: {
      message?: unknown
    }
  }

  if (typeof source.message === "string" && source.message) return source.message
  if (typeof source.error?.message === "string" && source.error.message) return source.error.message
  return null
}

function toGigWorker(input: unknown): GigWorker | null {
  if (!input || typeof input !== "object") return null

  const source = input as Partial<GigWorker> & {
    id?: string
    name?: string
    role?: string
    region?: string
    timezone?: string
    skills?: unknown
    languages?: unknown
    qualityScore?: number
    availability?: GigWorker["availability"]
    workload?: number
    maxWorkload?: number
    hourlyRate?: number
    bio?: string
  }

  if (!source.id || !source.name || !source.availability) {
    return null
  }

  const fallback = mockWorkers.find((worker) => worker.id === source.id)

  return {
    id: source.id,
    name: source.name ?? fallback?.name ?? source.id,
    role: source.role ?? fallback?.role ?? "Gig Worker",
    region: source.region ?? fallback?.region ?? "Unknown",
    timezone: source.timezone ?? fallback?.timezone ?? "UTC",
    skills: Array.isArray(source.skills) ? source.skills : fallback?.skills ?? [],
    languages: Array.isArray(source.languages) ? source.languages : fallback?.languages ?? [],
    qualityScore: typeof source.qualityScore === "number" ? source.qualityScore : fallback?.qualityScore ?? 0,
    availability: source.availability ?? fallback?.availability ?? "available",
    workload: typeof source.workload === "number" ? source.workload : fallback?.workload ?? 0,
    maxWorkload: typeof source.maxWorkload === "number" ? source.maxWorkload : fallback?.maxWorkload ?? 0,
    hourlyRate: typeof source.hourlyRate === "number" ? source.hourlyRate : fallback?.hourlyRate ?? 0,
    bio: source.bio ?? fallback?.bio ?? "Loaded from standalone backend. Additional worker details are synthetic defaults in frontend.",
  }
}

function normalizeEntityType(input: unknown, fallback: AuditEvent["entityType"] = "task"): AuditEvent["entityType"] {
  if (typeof input !== "string") return fallback

  switch (input) {
    case "job":
    case "task":
    case "worker":
    case "review":
    case "payout":
      return input
    case "agent":
      return "worker"
    default:
      return fallback
  }
}

function toAuditEvent(input: unknown): AuditEvent | null {
  if (!input || typeof input !== "object") return null

  const source = input as Partial<AuditEvent> & {
    id?: string
    timestamp?: string
    eventType?: AuditEvent["eventType"]
    actor?: string
    entityType?: string
    entityId?: string
    summary?: string
    details?: string
  }

  if (!source.id || !source.timestamp || !source.eventType || !source.entityId || !source.summary) {
    return null
  }

  const fallback = mockAuditEvents.find((event) => event.id === source.id) ?? mockAuditEvents.find((event) => event.entityId === source.entityId)

  return {
    id: source.id,
    timestamp: source.timestamp ?? fallback?.timestamp ?? new Date().toISOString(),
    eventType: source.eventType,
    actor: source.actor ?? fallback?.actor ?? "system",
    entityType: normalizeEntityType(source.entityType, fallback?.entityType ?? "task"),
    entityId: source.entityId,
    summary: source.summary ?? fallback?.summary ?? "Audit event",
    details: source.details ?? fallback?.details ?? "Loaded from standalone backend. Additional audit details are synthetic defaults in frontend.",
  }
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

export async function getAgents(): Promise<GigWorker[]> {
  const apiBaseUrl = getApiBaseUrl()
  const url = apiBaseUrl ? `${apiBaseUrl}/agents` : "/api/agents"

  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Failed to fetch agents from ${url} (${response.status})`)
  }

  const payload = (await response.json()) as AgentsApiResponse
  const list = toList(payload)

  return list.map(toGigWorker).filter((worker): worker is GigWorker => Boolean(worker))
}

export async function getAudit(): Promise<AuditEvent[]> {
  const apiBaseUrl = getApiBaseUrl()
  const url = apiBaseUrl ? `${apiBaseUrl}/audit` : "/api/audit"

  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Failed to fetch audit events from ${url} (${response.status})`)
  }

  const payload = (await response.json()) as AuditApiResponse
  const list = toList(payload)

  return list.map(toAuditEvent).filter((event): event is AuditEvent => Boolean(event))
}

export async function assignTask(taskId: string, agentId: string): Promise<TaskItem> {
  const apiBaseUrl = getApiBaseUrl()

  if (!apiBaseUrl) {
    const fallback = mockTasks.find((task) => task.id === taskId)
    if (!fallback) {
      throw new Error(`Task ${taskId} was not found in mock fallback mode`)
    }

    return {
      ...fallback,
      assignedWorkerId: agentId,
      status: "assigned",
    }
  }

  const url = `${apiBaseUrl}/tasks/${taskId}/assign`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ agentId }),
  })

  const payload = (await response.json().catch(() => null)) as TaskMutationResponse | null
  if (!response.ok) {
    const message = toErrorMessage(payload) ?? `Failed to assign task via ${url} (${response.status})`
    throw new Error(message)
  }

  const updatedTask = toTaskItem(payload?.data ?? payload?.task ?? payload)
  if (!updatedTask) {
    throw new Error("Standalone backend returned an unsupported task assignment response")
  }

  return updatedTask
}
