import type { GigWorker, Priority, TaskItem } from "./types"

export interface AssignmentScore {
  worker: GigWorker
  total: number
  breakdown: {
    skills: number
    quality: number
    workload: number
    availability: number
    priority: number
  }
  rationale: string
}

const priorityBoost: Record<Priority, number> = {
  low: 0.9,
  normal: 1,
  high: 1.08,
  urgent: 1.15,
}

function overlapCount(left: string[], right: string[]): number {
  const rightSet = new Set(right)
  return left.filter((item) => rightSet.has(item)).length
}

function availableRatio(worker: GigWorker): number {
  if (worker.availability === "offline") return 0
  if (worker.availability === "busy") return 0.55
  return 1
}

export function scoreWorkerForTask(task: TaskItem, worker: GigWorker): AssignmentScore {
  const skillHits = overlapCount(task.requiredSkills, worker.skills)
  const skills = task.requiredSkills.length > 0 ? skillHits / task.requiredSkills.length : 0
  const quality = worker.qualityScore / 100
  const workload = worker.maxWorkload > 0 ? 1 - worker.workload / worker.maxWorkload : 0
  const availability = availableRatio(worker)
  const priority = priorityBoost[task.priority]

  const total = Math.round((skills * 45 + quality * 25 + workload * 15 + availability * 15) * priority)

  return {
    worker,
    total,
    breakdown: {
      skills: Math.round(skills * 45),
      quality: Math.round(quality * 25),
      workload: Math.round(workload * 15),
      availability: Math.round(availability * 15),
      priority: Math.round(priority * 5),
    },
    rationale: [
      skillHits > 0 ? `${skillHits} skill overlap${skillHits === 1 ? "" : "s"}` : "no direct skill overlap",
      `${worker.qualityScore}% quality score`,
      `${worker.workload}/${worker.maxWorkload} workload`,
      worker.availability,
    ].join(" · "),
  }
}

export function rankWorkersForTask(task: TaskItem, workers: GigWorker[]): AssignmentScore[] {
  return workers
    .map((worker) => scoreWorkerForTask(task, worker))
    .sort((a, b) => b.total - a.total)
}

export function pickBestWorker(task: TaskItem, workers: GigWorker[]): AssignmentScore | undefined {
  return rankWorkersForTask(task, workers)[0]
}