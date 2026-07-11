import type { JobStatus, TaskStatus } from "./types"

export type FlagTone = "warning" | "urgent"

export interface WorkflowStage<TStatus extends string> {
  key: string
  label: string
  statuses: TStatus[]
}

export interface WorkflowFlag {
  tone: FlagTone
  label: string
}

export const TASK_STAGES: WorkflowStage<TaskStatus>[] = [
  { key: "queued", label: "Queued", statuses: ["queued"] },
  { key: "assigned", label: "Assigned", statuses: ["assigned"] },
  { key: "in_review", label: "In review", statuses: ["in_review"] },
  { key: "approved", label: "Approved", statuses: ["approved"] },
  { key: "paid", label: "Paid", statuses: ["queued_for_payout", "paid"] },
]

export const JOB_STAGES: WorkflowStage<JobStatus>[] = [
  { key: "draft", label: "Draft", statuses: ["draft"] },
  { key: "queued", label: "Queued", statuses: ["queued"] },
  { key: "in_progress", label: "In progress", statuses: ["in_progress"] },
  { key: "qa", label: "QA", statuses: ["qa"] },
  { key: "complete", label: "Complete", statuses: ["complete"] },
]

// correction_needed and escalated are reachable from more than one stage (see
// canMoveToLifecycleStatus in api-client.ts), so they aren't fixed nodes on the happy
// path. Instead the stepper stays at the stage the task last came from and a flag
// badge communicates the exception.
export function getTaskStageIndex(status: TaskStatus): number {
  if (status === "correction_needed") return TASK_STAGES.findIndex((stage) => stage.key === "assigned")
  if (status === "escalated") return TASK_STAGES.findIndex((stage) => stage.key === "in_review")

  const index = TASK_STAGES.findIndex((stage) => stage.statuses.includes(status))
  return index === -1 ? 0 : index
}

export function getTaskFlag(status: TaskStatus): WorkflowFlag | undefined {
  if (status === "correction_needed") return { tone: "warning", label: "Correction needed" }
  if (status === "escalated") return { tone: "urgent", label: "Escalated" }
  return undefined
}

export function getTaskStageSubLabel(status: TaskStatus): string | undefined {
  if (status === "queued_for_payout") return "Queued for payout"
  if (status === "paid") return "Paid out"
  return undefined
}

// paused doesn't record which stage the job was in when it stopped, so it's shown
// at "in_progress" as a reasonable default rather than fixed job history.
export function getJobStageIndex(status: JobStatus): number {
  if (status === "paused") return JOB_STAGES.findIndex((stage) => stage.key === "in_progress")

  const index = JOB_STAGES.findIndex((stage) => stage.statuses.includes(status))
  return index === -1 ? 0 : index
}

export function getJobFlag(status: JobStatus): WorkflowFlag | undefined {
  if (status === "paused") return { tone: "warning", label: "Paused" }
  return undefined
}
