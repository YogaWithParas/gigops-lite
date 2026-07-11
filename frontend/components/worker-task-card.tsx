import { Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WorkflowStepper } from "@/components/workflow-stepper"
import { TASK_STAGES, getTaskFlag, getTaskStageIndex, getTaskStageSubLabel } from "@/lib/workflow-stages"
import type { TaskItem } from "@/lib/types"

// Deliberately not TaskDetailPanel: that component exposes assignment and QA
// actions that belong to Ops. A worker can only see their task and submit it.
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

function actionLabel(status: TaskItem["status"]) {
  switch (status) {
    case "assigned":
    case "correction_needed":
      return "Submit for review"
    case "in_review":
      return "Submitted — awaiting QA"
    case "escalated":
      return "Escalated — awaiting ops"
    case "approved":
    case "queued_for_payout":
    case "paid":
      return "Completed"
    default:
      return "No action needed yet"
  }
}

export function WorkerTaskCard({
  task,
  onSubmitForReview,
  isBusy,
}: {
  task: TaskItem
  onSubmitForReview: (taskId: string) => void
  isBusy: boolean
}) {
  const canSubmitForReview = task.status === "assigned" || task.status === "correction_needed"

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">{task.title}</p>
            <p className="text-sm text-muted-foreground">
              {task.id} · {task.jobId}
            </p>
          </div>
          <Badge className={statusStyle(task.status)}>{task.status.replace("_", " ")}</Badge>
        </div>

        <WorkflowStepper
          stages={TASK_STAGES}
          currentIndex={getTaskStageIndex(task.status)}
          flag={getTaskFlag(task.status)}
          subLabel={getTaskStageSubLabel(task.status)}
        />

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Skills</p>
            <p className="text-foreground">{task.requiredSkills.join(", ") || "None listed"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Est. time</p>
            <p className="text-foreground">{task.estimatedMinutes} min</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Due</p>
            <p className="text-foreground">{task.dueAt}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Payout</p>
            <p className="text-foreground">${task.payoutAmount.toFixed(2)}</p>
          </div>
        </div>

        {task.notes ? <p className="text-sm text-muted-foreground">{task.notes}</p> : null}

        <Button
          type="button"
          className="w-full"
          disabled={!canSubmitForReview || isBusy}
          onClick={() => onSubmitForReview(task.id)}
        >
          <Send className="size-4" aria-hidden="true" />
          {actionLabel(task.status)}
        </Button>
      </CardContent>
    </Card>
  )
}
