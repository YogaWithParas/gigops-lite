"use client"

import { useMemo } from "react"
import { RotateCcw, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { rankWorkersForTask } from "@/lib/gig-ops"
import type { GigWorker, TaskItem } from "@/lib/types"

type LifecycleStatus = "in_review" | "approved" | "correction_needed" | "escalated"

function statusStyle(status: TaskItem["status"]) {
  switch (status) {
    case "approved":
    case "queued_for_payout":
    case "paid":
      return "bg-emerald-100 text-emerald-800"
    case "correction_needed":
      return "bg-amber-100 text-amber-800"
    case "escalated":
      return "bg-rose-100 text-rose-800"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export function TaskDetailPanel({
  task,
  agents,
  isBusy,
  errorMessage,
  statusMessage,
  onAssign,
  onUnassign,
  onLifecycleAction,
}: {
  task: TaskItem | undefined
  agents: GigWorker[]
  isBusy: boolean
  errorMessage: string
  statusMessage: string
  onAssign: (agentId: string) => void
  onUnassign: () => void
  onLifecycleAction: (status: LifecycleStatus) => void
}) {
  const ranked = useMemo(() => (task ? rankWorkersForTask(task, agents) : []), [task, agents])
  const topPick = ranked[0]
  const assignedAgent = agents.find((agent) => agent.id === task?.assignedWorkerId)

  if (!task) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">
            Select a task from the board to see details and assignment recommendations.
          </p>
        </CardContent>
      </Card>
    )
  }

  const hasAssignment = Boolean(task.assignedWorkerId)
  const canStartReview =
    hasAssignment && (task.status === "assigned" || task.status === "correction_needed" || task.status === "escalated")
  const canApprove = hasAssignment && (task.status === "assigned" || task.status === "in_review")
  const canCorrectionNeeded = hasAssignment && (task.status === "assigned" || task.status === "in_review")
  const canEscalate =
    hasAssignment && (task.status === "assigned" || task.status === "in_review" || task.status === "correction_needed")

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected task</p>
          <p className="text-lg font-semibold text-foreground">{task.title}</p>
          <p className="text-sm text-muted-foreground">
            {task.id} · {task.jobId}
          </p>
          <Badge className={`mt-2 ${statusStyle(task.status)}`}>{task.status.replace("_", " ")}</Badge>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Top recommendation</p>
          <p className="text-sm font-medium text-foreground">{topPick?.worker.name ?? "No worker available"}</p>
          <p className="text-xs text-muted-foreground">{topPick?.rationale}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Current assignment</p>
          <p className="text-sm font-medium text-foreground">{assignedAgent?.name ?? "Unassigned"}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Scored recommendations</p>
          {ranked.length === 0 ? (
            <p className="text-xs text-muted-foreground">No agents available for recommendation.</p>
          ) : (
            ranked.slice(0, 3).map((entry) => (
              <div key={entry.worker.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{entry.worker.name}</p>
                  <span className="tabular-nums text-sm text-muted-foreground">{entry.total}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Matched skills: {entry.matchedSkills.length > 0 ? entry.matchedSkills.join(", ") : "none"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Capacity: {entry.capacityLabel} · {entry.worker.workload}/{entry.worker.maxWorkload} load
                </p>
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAssign(entry.worker.id)}
                    disabled={isBusy || task.assignedWorkerId === entry.worker.id}
                  >
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    {task.assignedWorkerId === entry.worker.id ? "Assigned" : "Assign"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Lifecycle actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy || !canStartReview}
              onClick={() => onLifecycleAction("in_review")}
            >
              Start review
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy || !canApprove}
              onClick={() => onLifecycleAction("approved")}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy || !canCorrectionNeeded}
              onClick={() => onLifecycleAction("correction_needed")}
            >
              Correction needed
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy || !canEscalate}
              onClick={() => onLifecycleAction("escalated")}
            >
              Escalate
            </Button>
          </div>
        </div>

        {errorMessage ? (
          <p role="alert" className="text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}
        {statusMessage ? <p className="text-sm text-muted-foreground">{statusMessage}</p> : null}

        <Button type="button" variant="outline" className="w-full" onClick={onUnassign} disabled={isBusy || !hasAssignment}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Unassign
        </Button>
      </CardContent>
    </Card>
  )
}
