"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BriefcaseBusiness, CheckCircle2, ClipboardList, Layers3 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { WorkflowStepper } from "@/components/workflow-stepper"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getJobs } from "@/lib/api-client"
import { usePersona } from "@/lib/persona-context"
import { JOB_STAGES, getJobFlag, getJobStageIndex } from "@/lib/workflow-stages"
import type { JobBatch } from "@/lib/types"

export default function ClientPage() {
  const { clientName, setClientName } = usePersona()
  const [jobsData, setJobsData] = useState<JobBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)

      try {
        const nextJobs = await getJobs()
        if (cancelled) return

        setJobsData(nextJobs)
      } catch (error) {
        if (cancelled) return
        console.error("Failed to load client jobs", error)
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

  const clientNames = useMemo(
    () => Array.from(new Set(jobsData.map((job) => job.clientName))).sort(),
    [jobsData],
  )
  const myJobs = useMemo(() => jobsData.filter((job) => job.clientName === clientName), [jobsData, clientName])
  const activeJobCount = myJobs.filter((job) => job.status !== "complete").length
  const completedTaskTotal = myJobs.reduce((sum, job) => sum + job.completedTaskCount, 0)
  const taskTotal = myJobs.reduce((sum, job) => sum + job.taskCount, 0)

  return (
    <>
      <PageHeader
        title="My Jobs"
        description="Jobs you've submitted and their current stage. No internal assignment or worker details are shown here."
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="client-picker" className="text-xs font-medium text-muted-foreground">
            Demo as client
          </Label>
          <Select value={clientName} onValueChange={(value) => value && setClientName(value)}>
            <SelectTrigger id="client-picker" className="w-56 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {clientNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <section aria-label="My job metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="My jobs" value={myJobs.length} hint="Submitted batches" icon={BriefcaseBusiness} />
        <StatCard label="Active" value={activeJobCount} hint="Not yet complete" icon={Layers3} />
        <StatCard label="Tasks done" value={`${completedTaskTotal} / ${taskTotal}`} hint="Across all your jobs" icon={CheckCircle2} />
      </section>

      <div className="mt-6 flex justify-end">
        <Button asChild>
          <Link href="/client/new">
            <ClipboardList className="size-4" aria-hidden="true" />
            Request a job
          </Link>
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading your jobs...</p> : null}
        {!isLoading && myJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs found for this client yet.</p>
        ) : null}
        {myJobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="font-semibold text-foreground">{job.title}</p>
                <p className="text-sm text-muted-foreground">
                  {job.id} · Due {job.dueDate}
                </p>
              </div>
              <WorkflowStepper stages={JOB_STAGES} currentIndex={getJobStageIndex(job.status)} flag={getJobFlag(job.status)} />
              <p className="text-sm text-muted-foreground">
                {job.completedTaskCount} / {job.taskCount} tasks complete · {job.qaPassRate}% QA pass rate
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
