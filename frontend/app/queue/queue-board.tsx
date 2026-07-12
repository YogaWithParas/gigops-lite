"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { TaskBoardColumn } from "@/components/task-board-column"
import { TaskDetailPanel } from "@/components/task-detail-panel"
import { Badge } from "@/components/ui/badge"
import { gigWorkers } from "@/lib/gig-data"
import { assignTask, getAgents, getTasks, updateTaskLifecycleStatus } from "@/lib/api-client"
import type { GigWorker, TaskItem } from "@/lib/types"
import { CheckCircle2, ListTodo, ShieldAlert, UsersRound } from "lucide-react"

type LifecycleStatus = "in_review" | "approved" | "correction_needed" | "escalated"

const columns: { key: string; title: string; statuses: TaskItem["status"][] }[] = [
  { key: "queued", title: "Queued", statuses: ["queued"] },
  { key: "assigned", title: "Assigned", statuses: ["assigned"] },
  { key: "in_review", title: "In review", statuses: ["in_review"] },
  { key: "correction_needed", title: "Correction needed", statuses: ["correction_needed"] },
  { key: "escalated", title: "Escalated", statuses: ["escalated"] },
  { key: "done", title: "Done", statuses: ["approved", "queued_for_payout", "paid"] },
]

export function QueueBoard() {
  const isBackendMode = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL?.trim())
  const searchParams = useSearchParams()
  const requestedTaskId = searchParams.get("taskId") ?? ""

  const [tasksData, setTasksData] = useState<TaskItem[]>([])
  const [agentsData, setAgentsData] = useState<GigWorker[]>(gigWorkers)
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isUpdatingLifecycle, setIsUpdatingLifecycle] = useState(false)
  const [assignmentError, setAssignmentError] = useState("")
  const [assignmentMessage, setAssignmentMessage] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadTasks() {
      setIsLoadingTasks(true)

      try {
        const nextTasks = await getTasks()
        if (cancelled) return

        setTasksData(nextTasks)
        const preferredTaskId = nextTasks.some((task) => task.id === requestedTaskId) ? requestedTaskId : ""
        setSelectedTaskId(preferredTaskId || nextTasks[0]?.id || "")
      } catch (error) {
        if (cancelled) return
        console.error("Failed to load tasks", error)
      } finally {
        if (cancelled) return
        setIsLoadingTasks(false)
      }
    }

    loadTasks()

    return () => {
      cancelled = true
    }
    // Only re-run on mount: requestedTaskId is read once to preselect a task from the dashboard link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadAgents() {
      try {
        const nextAgents = await getAgents()
        if (cancelled) return

        setAgentsData(nextAgents)
      } catch (error) {
        if (cancelled) return
        console.error("Failed to load agents", error)
      }
    }

    loadAgents()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedTask = useMemo(() => tasksData.find((task) => task.id === selectedTaskId), [selectedTaskId, tasksData])

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, TaskItem[]> = {}
    for (const column of columns) {
      grouped[column.key] = tasksData.filter((task) => column.statuses.includes(task.status))
    }
    return grouped
  }, [tasksData])

  const queuedCount = tasksByColumn.queued?.length ?? 0
  const activeCount = (tasksByColumn.assigned?.length ?? 0) + (tasksByColumn.in_review?.length ?? 0)
  const needsAttentionCount = (tasksByColumn.correction_needed?.length ?? 0) + (tasksByColumn.escalated?.length ?? 0)
  const doneCount = tasksByColumn.done?.length ?? 0

  const isBusy = isLoadingTasks || isAssigning || isUpdatingLifecycle

  async function runAssignment(nextAgentId: string | null) {
    if (!selectedTask) return

    setIsAssigning(true)
    setAssignmentError("")
    setAssignmentMessage("")

    try {
      const updatedTask = await assignTask(selectedTask.id, nextAgentId)
      setTasksData((current) => current.map((task) => (task.id === updatedTask.id ? { ...task, ...updatedTask } : task)))

      const targetAgent = agentsData.find((agent) => agent.id === nextAgentId)
      if (nextAgentId === null) {
        setAssignmentMessage(
          isBackendMode
            ? `Unassigned ${selectedTask.id} via the standalone backend.`
            : `Mock fallback mode unassigned ${selectedTask.id} locally only.`,
        )
      } else {
        setAssignmentMessage(
          isBackendMode
            ? `Assigned ${selectedTask.id} to ${targetAgent?.name ?? nextAgentId} via the standalone backend.`
            : `Mock fallback mode updated ${selectedTask.id} locally only.`,
        )
      }
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Task assignment failed")
    } finally {
      setIsAssigning(false)
    }
  }

  async function runLifecycleAction(status: LifecycleStatus) {
    if (!selectedTask) return

    setIsUpdatingLifecycle(true)
    setAssignmentError("")
    setAssignmentMessage("")

    try {
      const updatedTask = await updateTaskLifecycleStatus(selectedTask.id, status)
      setTasksData((current) => current.map((task) => (task.id === updatedTask.id ? { ...task, ...updatedTask } : task)))

      setAssignmentMessage(
        isBackendMode
          ? `Updated ${selectedTask.id} to ${status.replace("_", " ")} via the standalone backend.`
          : `Mock fallback mode updated ${selectedTask.id} to ${status.replace("_", " ")} locally only.`,
      )
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Task lifecycle action failed")
    } finally {
      setIsUpdatingLifecycle(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Task Queue Board"
        description="Kanban-style view of the same task data as /tasks, grouped by lifecycle status with scored assignment recommendations for the selected task."
      >
        <Badge className="border-transparent bg-accent text-accent-foreground">
          {isBackendMode ? "Assignment action uses standalone backend" : "Assignment action is mock-only in fallback mode"}
        </Badge>
      </PageHeader>

      <section aria-label="Queue metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Queued" value={queuedCount} hint="Waiting for assignment" icon={ListTodo} />
        <StatCard label="Assigned / review" value={activeCount} hint="In worker or QA flow" icon={UsersRound} />
        <StatCard label="Needs attention" value={needsAttentionCount} hint="Correction needed or escalated" icon={ShieldAlert} />
        <StatCard label="Done" value={doneCount} hint="Approved or payout ready" icon={CheckCircle2} />
      </section>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2" data-tour="kanban-board">
        {columns.map((column) => (
          <TaskBoardColumn
            key={column.key}
            title={column.title}
            tasks={tasksByColumn[column.key] ?? []}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
          />
        ))}
      </div>

      <div className="mt-6 max-w-xl" data-tour="task-detail-panel">
        <TaskDetailPanel
          task={selectedTask}
          agents={agentsData}
          isBusy={isBusy}
          errorMessage={assignmentError}
          statusMessage={assignmentMessage}
          onAssign={(agentId) => runAssignment(agentId)}
          onUnassign={() => runAssignment(null)}
          onLifecycleAction={(status) => runLifecycleAction(status)}
        />
      </div>
    </>
  )
}
