"use client"

import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TagList } from "@/components/tag-list"
import { CapacityBar } from "@/components/capacity-bar"
import { gigWorkers } from "@/lib/gig-data"
import { getAgents, getJobs, getTasks } from "@/lib/api-client"
import type { JobBatch, TaskItem } from "@/lib/types"
import { Building2, Languages, ShieldCheck, UsersRound } from "lucide-react"

function capacityLabel(activeTaskCount: number) {
  if (activeTaskCount === 0) return "Available"
  if (activeTaskCount <= 2) return "Busy"
  return "Overloaded"
}

function taskStatusTone(status: TaskItem["status"]) {
  switch (status) {
    case "approved":
    case "queued_for_payout":
    case "paid":
      return "bg-emerald-100 text-emerald-800"
    case "assigned":
    case "in_review":
      return "bg-sky-100 text-sky-800"
    case "correction_needed":
      return "bg-amber-100 text-amber-800"
    case "escalated":
      return "bg-rose-100 text-rose-800"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

export default function AgentsPage() {
  const [workers, setWorkers] = useState(gigWorkers)
  const [tasksData, setTasksData] = useState<TaskItem[]>([])
  const [jobsData, setJobsData] = useState<JobBatch[]>([])
  const [selectedWorkerId, setSelectedWorkerId] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadAgents() {
      try {
        const [nextWorkers, nextTasks, nextJobs] = await Promise.all([getAgents(), getTasks(), getJobs()])
        if (cancelled) return

        setWorkers(nextWorkers)
        setTasksData(nextTasks)
        setJobsData(nextJobs)
        setSelectedWorkerId((current) => (current ? current : nextWorkers[0]?.id ?? ""))
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

  const workersWithWorkload = useMemo(
    () =>
      workers.map((worker) => {
        const assignedTasks = tasksData.filter((task) => task.assignedWorkerId === worker.id)
        const activeTaskCount = assignedTasks.filter(
          (task) => task.status === "assigned" || task.status === "in_review",
        ).length
        const queuedOrReviewCount = assignedTasks.filter(
          (task) => task.status === "queued" || task.status === "assigned" || task.status === "in_review",
        ).length
        const doneCount = assignedTasks.filter(
          (task) => task.status === "approved" || task.status === "queued_for_payout" || task.status === "paid",
        ).length

        return {
          ...worker,
          assignedTasks,
          activeTaskCount,
          queuedOrReviewCount,
          doneCount,
          capacityLabel: capacityLabel(activeTaskCount),
        }
      }),
    [tasksData, workers],
  )

  const selectedWorker = useMemo(
    () => workersWithWorkload.find((worker) => worker.id === selectedWorkerId) ?? workersWithWorkload[0],
    [selectedWorkerId, workersWithWorkload],
  )
  const activeWorkerId = selectedWorker?.id ?? ""

  const jobsById = useMemo(() => new Map(jobsData.map((job) => [job.id, job])), [jobsData])

  const available = workersWithWorkload.filter((worker) => worker.capacityLabel === "Available").length
  const busy = workersWithWorkload.filter((worker) => worker.capacityLabel === "Busy").length
  const overloaded = workersWithWorkload.filter((worker) => worker.capacityLabel === "Overloaded").length
  const avgQuality = Math.round(workersWithWorkload.reduce((sum, worker) => sum + worker.qualityScore, 0) / Math.max(workersWithWorkload.length, 1))

  return (
    <>
      <PageHeader title="Agents" description="Worker profiles for synthetic gig operations. Skills, availability, and quality guide task assignment.">
        <Badge className="border-transparent bg-accent text-accent-foreground">Synthetic workforce</Badge>
      </PageHeader>

      <section aria-label="Agent metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available" value={available} hint="Ready for assignment" icon={UsersRound} />
        <StatCard label="Busy" value={busy} hint="1-2 active tasks" icon={Building2} />
        <StatCard label="Overloaded" value={overloaded} hint="3+ active tasks" icon={ShieldCheck} />
        <StatCard label="Average quality" value={`${avgQuality}%`} hint="Synthetic quality score" icon={Languages} />
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Selected agent workload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Agent</p>
              <p className="text-sm font-medium text-foreground">{selectedWorker?.name ?? "No agent selected"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Capacity</p>
              <p className="text-sm font-medium text-foreground">{selectedWorker?.capacityLabel ?? "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Assigned active tasks</p>
              <p className="text-sm font-medium text-foreground">{selectedWorker?.activeTaskCount ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Queued / review / done</p>
              <p className="text-sm font-medium text-foreground">{selectedWorker ? `${selectedWorker.queuedOrReviewCount} / ${selectedWorker.doneCount}` : "0 / 0"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {workersWithWorkload.map((worker) => (
              <button
                key={worker.id}
                type="button"
                onClick={() => setSelectedWorkerId(worker.id)}
                aria-pressed={activeWorkerId === worker.id}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${activeWorkerId === worker.id ? "border-primary bg-secondary text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}
              >
                {worker.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {workersWithWorkload.map((worker) => (
          <Card
            key={worker.id}
            className={`h-full cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeWorkerId === worker.id
                ? "bg-secondary ring-2 ring-primary"
                : "hover:bg-muted/30"
            }`}
            role="button"
            tabIndex={0}
            aria-pressed={activeWorkerId === worker.id}
            aria-current={activeWorkerId === worker.id ? "true" : undefined}
            onClick={() => setSelectedWorkerId(worker.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                setSelectedWorkerId(worker.id)
              }
            }}
          >
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{worker.name}</h2>
                    <p className="text-sm text-muted-foreground">{worker.role} · {worker.region} · {worker.timezone}</p>
                  </div>
                  <div className="flex gap-2">
                    {activeWorkerId === worker.id ? <Badge variant="outline">Selected</Badge> : null}
                    <Badge>{worker.capacityLabel}</Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{worker.bio}</p>
              </div>
              <TagList label="Skills" items={worker.skills} variant="need" />
              <TagList label="Languages" items={worker.languages} />
              <CapacityBar current={worker.activeTaskCount} capacity={3} />
              <p className="text-sm text-muted-foreground">Assigned active tasks: {worker.activeTaskCount} · Quality score: {worker.qualityScore}% · Hourly rate: ${worker.hourlyRate}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tasks owned by {selectedWorker?.name ?? "selected agent"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedWorker && selectedWorker.assignedTasks.length > 0 ? (
            selectedWorker.assignedTasks.map((task) => {
              const job = jobsById.get(task.jobId)

              return (
                <div key={task.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.id} · {job?.title ?? task.jobId}</p>
                    </div>
                    <Badge className={taskStatusTone(task.status)}>{task.status.replace("_", " ")}</Badge>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground">No active tasks owned by this agent.</p>
          )}
        </CardContent>
      </Card>
    </>
  )
}