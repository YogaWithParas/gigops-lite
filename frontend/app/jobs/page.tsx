"use client"

import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getJobs, getTasks } from "@/lib/api-client"
import type { JobBatch, JobStatus, JobType, Priority, TaskItem } from "@/lib/types"
import { BriefcaseBusiness, CalendarDays, CircleCheckBig, Layers3 } from "lucide-react"

const jobTypeOptions: JobType[] = ["cx", "data-labeling"]
const priorityOptions: Priority[] = ["low", "normal", "high", "urgent"]
const statusOptions: JobStatus[] = ["draft", "queued", "in_progress", "qa", "complete", "paused"]

function formatJobType(type: JobType) {
  return type === "cx" ? "CX" : "Data labeling"
}

function statusTone(status: JobStatus) {
  switch (status) {
    case "complete":
      return "bg-emerald-100 text-emerald-800"
    case "qa":
      return "bg-amber-100 text-amber-800"
    case "in_progress":
      return "bg-sky-100 text-sky-800"
    case "paused":
      return "bg-slate-200 text-slate-800"
    default:
      return "bg-secondary text-secondary-foreground"
  }
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

function seedJob(): JobBatch {
  return {
    id: "JOB-NEW",
    clientName: "New synthetic client",
    title: "Prototype intake batch",
    type: "cx",
    priority: "normal",
    status: "draft",
    taskCount: 24,
    completedTaskCount: 0,
    qaPassRate: 0,
    dueDate: "2026-06-22",
    createdAt: new Date().toISOString(),
    notes: "Synthetic placeholder job for UI review only.",
    requiredSkills: ["chat support", "case triage"],
  }
}

export default function JobsPage() {
  const [jobsData, setJobsData] = useState<JobBatch[]>([])
  const [tasksData, setTasksData] = useState<TaskItem[]>([])
  const [draft, setDraft] = useState(seedJob())
  const [selectedJobId, setSelectedJobId] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadJobs() {
      try {
        const [nextJobs, nextTasks] = await Promise.all([getJobs(), getTasks()])
        if (cancelled) return

        setJobsData(nextJobs)
        setTasksData(nextTasks)
        setSelectedJobId((current) => (current ? current : nextJobs[0]?.id ?? ""))
      } catch (error) {
        if (cancelled) return
        console.error("Failed to load jobs", error)
      }
    }

    loadJobs()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedJob = useMemo(() => jobsData.find((job) => job.id === selectedJobId) ?? jobsData[0], [selectedJobId, jobsData])
  const relatedTasks = useMemo(
    () => tasksData.filter((task) => task.jobId === selectedJob?.id),
    [selectedJob, tasksData],
  )
  const relatedTaskCount = relatedTasks.length
  const queuedRelatedTasks = relatedTasks.filter((task) => task.status === "queued").length
  const assignedOrReviewRelatedTasks = relatedTasks.filter((task) => task.status === "assigned" || task.status === "in_review").length
  const doneRelatedTasks = relatedTasks.filter((task) => task.status === "approved" || task.status === "queued_for_payout" || task.status === "paid").length

  const activeJobs = jobsData.filter((job) => job.status !== "complete").length
  const jobsInQa = jobsData.filter((job) => job.status === "qa").length
  const dueSoon = jobsData.filter((job) => job.priority === "urgent" || job.priority === "high").length

  function scrollToRelatedTasks() {
    document.getElementById("related-tasks")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Client job batches are synthetic and editable in the browser. Use this view to review intake, priority, and dispatch readiness."
      >
        <Badge className="border-transparent bg-accent text-accent-foreground">Prototype data only</Badge>
      </PageHeader>

      <section aria-label="Job metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active batches" value={activeJobs} hint="Non-complete jobs" icon={BriefcaseBusiness} />
        <StatCard label="QA batches" value={jobsInQa} hint="Waiting on review" icon={Layers3} />
        <StatCard label="Urgent or high priority" value={dueSoon} hint="Require close attention" icon={CalendarDays} />
        <StatCard label="Synthetic batches" value={jobsData.length} hint="All mocked from memory" icon={CircleCheckBig} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Job batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobsData.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => setSelectedJobId(job.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedJobId === job.id ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/40"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.clientName} · {formatJobType(job.type)}</p>
                    </div>
                    <Badge className={statusTone(job.status)}>{job.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="border-border text-muted-foreground">{skill}</Badge>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create / review batch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">This form is synthetic. A future backend can wire it to Cloud Run and Firestore.</p>
            <div className="space-y-2">
              <Label htmlFor="job-client">Client</Label>
              <Input id="job-client" value={draft.clientName} onChange={(event) => setDraft({ ...draft, clientName: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-title">Title</Label>
              <Input id="job-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="job-type">Type</Label>
                <select aria-label="Job type" id="job-type" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as JobType })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {jobTypeOptions.map((type) => <option key={type} value={type}>{formatJobType(type)}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-priority">Priority</Label>
                <select aria-label="Job priority" id="job-priority" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-status">Review state</Label>
              <select aria-label="Job review state" id="job-status" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as JobStatus })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {statusOptions.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-notes">Notes</Label>
              <Textarea id="job-notes" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} rows={4} />
            </div>
            <Button className="w-full">Save synthetic draft</Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Selected job review</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedJob ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Client</p>
                <p className="text-sm text-foreground">{selectedJob.clientName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Volume</p>
                <p className="text-sm text-foreground">{selectedJob.completedTaskCount} / {selectedJob.taskCount} tasks complete</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Due date</p>
                <p className="text-sm text-foreground">{selectedJob.dueDate}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">QA pass rate</p>
                <p className="text-sm text-foreground">{selectedJob.qaPassRate}%</p>
              </div>
              <div className="md:col-span-2 xl:col-span-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                <p className="text-sm leading-relaxed text-foreground">{selectedJob.notes}</p>
              </div>
              <div className="md:col-span-2 xl:col-span-4 flex items-center gap-3">
                <Button type="button" variant="outline" onClick={scrollToRelatedTasks}>
                  View related tasks
                </Button>
                <p className="text-xs text-muted-foreground">Tasks are linked by jobId and shown below.</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="mt-6" id="related-tasks">
        <CardHeader>
          <CardTitle>Related tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard label="Related tasks" value={relatedTaskCount} hint="Linked by jobId" icon={Layers3} />
            <StatCard label="Queued" value={queuedRelatedTasks} hint="Waiting for assignment" icon={Layers3} />
            <StatCard label="Assigned / review" value={assignedOrReviewRelatedTasks} hint="In worker or QA flow" icon={Layers3} />
            <StatCard label="Done" value={doneRelatedTasks} hint="Approved or payout ready" icon={CircleCheckBig} />
          </div>

          <div className="space-y-3">
            {relatedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No related tasks surfaced for this job yet.</p>
            ) : (
              relatedTasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.id} · {task.requiredSkills.join(", ")}</p>
                    </div>
                    <Badge className={taskStatusTone(task.status)}>{task.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Assigned agent: {task.assignedWorkerId ?? "unassigned"}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}