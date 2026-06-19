"use client"

import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { gigWorkers } from "@/lib/gig-data"
import { assignTask, getTasks } from "@/lib/api-client"
import { pickBestWorker, rankWorkersForTask } from "@/lib/gig-ops"
import type { TaskItem } from "@/lib/types"
import { CheckCircle2, ListTodo, RotateCcw, Sparkles, UsersRound } from "lucide-react"

function statusStyle(status: TaskItem["status"]) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-800"
    case "correction_needed":
      return "bg-amber-100 text-amber-800"
    case "escalated":
      return "bg-rose-100 text-rose-800"
    case "queued_for_payout":
      return "bg-sky-100 text-sky-800"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export default function TasksPage() {
  const isBackendMode = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL?.trim())
  const [tasksData, setTasksData] = useState<TaskItem[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignmentError, setAssignmentError] = useState("")
  const [assignmentMessage, setAssignmentMessage] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadTasks() {
      setIsLoadingTasks(true)
      if (isBackendMode) {
        // Clear potentially stale mock UI state before backend tasks are loaded.
        setTasksData([])
        setSelectedTaskId("")
      }

      try {
        const nextTasks = await getTasks()
        if (cancelled) return

        setTasksData(nextTasks)
        setSelectedTaskId(nextTasks[0]?.id ?? "")
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
  }, [])

  const selectedTask = useMemo(() => tasksData.find((task) => task.id === selectedTaskId), [selectedTaskId, tasksData])
  const ranked = useMemo(() => (selectedTask ? rankWorkersForTask(selectedTask, gigWorkers) : []), [selectedTask])
  const topPick = useMemo(() => (selectedTask ? pickBestWorker(selectedTask, gigWorkers) : undefined), [selectedTask])

  const queuedTasks = tasksData.filter((task) => task.status === "queued").length
  const assignedTasks = tasksData.filter((task) => task.status === "assigned" || task.status === "in_review").length
  const doneTasks = tasksData.filter((task) => task.status === "approved" || task.status === "queued_for_payout" || task.status === "paid").length

  async function handleAssign() {
    if (!selectedTask || !topPick) return

    setIsAssigning(true)
    setAssignmentError("")
    setAssignmentMessage("")

    try {
      const updatedTask = await assignTask(selectedTask.id, topPick.worker.id)

      setTasksData((current) => current.map((task) => (task.id === updatedTask.id ? { ...task, ...updatedTask } : task)))
      setAssignmentMessage(
        isBackendMode
          ? `Assigned ${selectedTask.id} to ${topPick.worker.name} via the standalone backend.`
          : `Mock fallback mode updated ${selectedTask.id} locally only.`,
      )
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Task assignment failed")
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <>
      <PageHeader title="Tasks" description="Queue view for synthetic work items. Assignment scoring considers skills, quality, workload, availability, and priority.">
        <Badge className="border-transparent bg-accent text-accent-foreground">
          {isBackendMode ? "Assignment action uses standalone backend" : "Assignment action is mock-only in fallback mode"}
        </Badge>
      </PageHeader>

      <section aria-label="Task metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Queued" value={queuedTasks} hint="Waiting for assignment" icon={ListTodo} />
        <StatCard label="Assigned / review" value={assignedTasks} hint="In worker or QA flow" icon={UsersRound} />
        <StatCard label="Done" value={doneTasks} hint="Approved or payout ready" icon={CheckCircle2} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {tasksData.map((task) => (
                <button key={task.id} type="button" onClick={() => setSelectedTaskId(task.id)} className={`w-full p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedTaskId === task.id ? "bg-secondary" : "bg-card hover:bg-muted/40"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.id} · {task.requiredSkills.join(", ")}</p>
                    </div>
                    <Badge className={statusStyle(task.status)}>{task.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{task.notes}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected task</p>
              <p className="text-lg font-semibold text-foreground">{selectedTask?.title}</p>
              <p className="text-sm text-muted-foreground">{selectedTask?.jobId}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Top assignment candidate</p>
              <p className="text-sm font-medium text-foreground">{topPick?.worker.name ?? "No worker available"}</p>
              <p className="text-xs text-muted-foreground">{topPick?.rationale}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ranking preview</p>
              {ranked.slice(0, 3).map((entry) => (
                <div key={entry.worker.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{entry.worker.name}</p>
                    <p className="tabular-nums text-sm text-muted-foreground">{entry.total}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.rationale}</p>
                </div>
              ))}
            </div>
            {assignmentError ? <p role="alert" className="text-sm text-rose-700">{assignmentError}</p> : null}
            {assignmentMessage ? <p className="text-sm text-muted-foreground">{assignmentMessage}</p> : null}
            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleAssign} disabled={isLoadingTasks || !selectedTask || !topPick || isAssigning}>
                <Sparkles className="size-4" aria-hidden="true" />
                {isAssigning ? "Assigning..." : isLoadingTasks ? "Loading..." : "Assign"}
              </Button>
              <Button variant="outline" className="flex-1"><RotateCcw className="size-4" aria-hidden="true" />Re-score</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}