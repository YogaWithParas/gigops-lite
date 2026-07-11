"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, ListTodo, Send } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { WorkerTaskCard } from "@/components/worker-task-card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { gigWorkers } from "@/lib/gig-data"
import { getAgents, getTasks, updateTaskLifecycleStatus } from "@/lib/api-client"
import { usePersona } from "@/lib/persona-context"
import type { GigWorker, TaskItem } from "@/lib/types"

export default function WorkerPage() {
  const { workerId, setWorkerId } = usePersona()
  const [workers, setWorkers] = useState<GigWorker[]>(gigWorkers)
  const [tasksData, setTasksData] = useState<TaskItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)

      try {
        const [nextWorkers, nextTasks] = await Promise.all([getAgents(), getTasks()])
        if (cancelled) return

        setWorkers(nextWorkers)
        setTasksData(nextTasks)
      } catch (err) {
        if (cancelled) return
        console.error("Failed to load worker view", err)
      } finally {
        if (cancelled) return
        setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const myTasks = useMemo(() => tasksData.filter((task) => task.assignedWorkerId === workerId), [tasksData, workerId])
  const activeCount = myTasks.filter(
    (task) => task.status === "assigned" || task.status === "in_review" || task.status === "correction_needed",
  ).length
  const doneCount = myTasks.filter(
    (task) => task.status === "approved" || task.status === "queued_for_payout" || task.status === "paid",
  ).length
  const currentWorker = workers.find((worker) => worker.id === workerId)

  async function handleSubmitForReview(taskId: string) {
    setIsSubmitting(true)
    setError("")

    try {
      const updated = await updateTaskLifecycleStatus(taskId, "in_review")
      setTasksData((current) => current.map((task) => (task.id === updated.id ? { ...task, ...updated } : task)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit task for review")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="My Tasks"
        description="Tasks assigned to you. Submit your work when it's ready for QA review."
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="worker-picker" className="text-xs font-medium text-muted-foreground">
            Demo as worker
          </Label>
          <Select value={workerId} onValueChange={(value) => value && setWorkerId(value)}>
            <SelectTrigger id="worker-picker" className="w-56 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id}>
                  {worker.name} ({worker.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <section aria-label="My task metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="My tasks" value={myTasks.length} hint={currentWorker?.name ?? "Select a worker"} icon={ListTodo} />
        <StatCard label="Active" value={activeCount} hint="Assigned, in review, or needs correction" icon={Send} />
        <StatCard label="Done" value={doneCount} hint="Approved or paid" icon={CheckCircle2} />
      </section>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-4">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading your tasks...</p> : null}
        {!isLoading && myTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks assigned to you right now.</p>
        ) : null}
        {myTasks.map((task) => (
          <WorkerTaskCard key={task.id} task={task} onSubmitForReview={handleSubmitForReview} isBusy={isSubmitting} />
        ))}
      </div>
    </>
  )
}
