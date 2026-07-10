import { Badge } from "@/components/ui/badge"
import type { TaskItem } from "@/lib/types"

const priorityStyle: Record<TaskItem["priority"], string> = {
  urgent: "bg-rose-100 text-rose-800",
  high: "bg-amber-100 text-amber-800",
  normal: "bg-secondary text-secondary-foreground",
  low: "bg-muted text-muted-foreground",
}

export function TaskBoardColumn({
  title,
  tasks,
  selectedTaskId,
  onSelectTask,
}: {
  title: string
  tasks: TaskItem[]
  selectedTaskId: string
  onSelectTask: (taskId: string) => void
}) {
  return (
    <div className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-muted/30 p-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <Badge variant="outline">{tasks.length}</Badge>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <p className="px-1 text-xs text-muted-foreground">No tasks in this column.</p>
        ) : (
          tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelectTask(task.id)}
              aria-pressed={selectedTaskId === task.id}
              className={`w-full rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selectedTaskId === task.id
                  ? "border-primary bg-secondary"
                  : "border-border bg-card hover:bg-muted/40"
              }`}
            >
              <p className="text-sm font-medium text-foreground">{task.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{task.id}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Badge className={priorityStyle[task.priority]}>{task.priority}</Badge>
                <span className="truncate text-xs text-muted-foreground">
                  {task.assignedWorkerId ?? "unassigned"}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
