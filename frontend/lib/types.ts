export type JobType = "cx" | "data-labeling"

export type JobStatus =
  | "draft"
  | "queued"
  | "in_progress"
  | "qa"
  | "complete"
  | "paused"

export type TaskStatus =
  | "queued"
  | "assigned"
  | "in_review"
  | "approved"
  | "correction_needed"
  | "escalated"
  | "queued_for_payout"
  | "paid"

export type ReviewOutcome = "approved" | "correction-needed" | "escalated"

export type WorkerAvailability = "available" | "busy" | "offline"

export type Priority = "low" | "normal" | "high" | "urgent"

export interface GigWorker {
  id: string
  name: string
  role: string
  region: string
  timezone: string
  skills: string[]
  languages: string[]
  qualityScore: number
  availability: WorkerAvailability
  workload: number
  maxWorkload: number
  hourlyRate: number
  bio: string
}

export interface JobBatch {
  id: string
  clientName: string
  title: string
  type: JobType
  priority: Priority
  status: JobStatus
  taskCount: number
  completedTaskCount: number
  qaPassRate: number
  dueDate: string
  createdAt: string
  notes: string
  requiredSkills: string[]
}

export interface TaskItem {
  id: string
  jobId: string
  title: string
  type: JobType
  priority: Priority
  status: TaskStatus
  requiredSkills: string[]
  estimatedMinutes: number
  assignedWorkerId?: string
  qaReviewer?: string
  qualityScore?: number
  payoutAmount: number
  dueAt: string
  createdAt: string
  notes: string
}

export interface QAReviewItem {
  id: string
  taskId: string
  jobId: string
  reviewer: string
  outcome: ReviewOutcome
  reason: string
  updatedAt: string
}

export interface PayoutRecord {
  id: string
  taskId: string
  workerId: string
  amount: number
  status: "queued" | "processing" | "paid"
  scheduledFor: string
  updatedAt: string
}

export interface AuditEvent {
  id: string
  timestamp: string
  eventType:
    | "job.created"
    | "job.reviewed"
    | "task.assigned"
    | "task.reassigned"
    | "qa.approved"
    | "qa.correction_needed"
    | "qa.escalated"
    | "payout.queued"
    | "payout.paid"
  actor: string
  entityType: "job" | "task" | "worker" | "review" | "payout"
  entityId: string
  summary: string
  details: string
}
