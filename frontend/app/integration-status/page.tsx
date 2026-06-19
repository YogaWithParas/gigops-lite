"use client"

import { useCallback, useMemo, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAgents, getAudit, getJobs, getTasks } from "@/lib/api-client"

type SurfaceKey = "jobs" | "tasks" | "agents" | "audit"
type CheckState = {
  loading: boolean
  ok: boolean
  count: number | null
  message: string
}

type Checks = Record<SurfaceKey, CheckState>

const initialChecks: Checks = {
  jobs: { loading: false, ok: false, count: null, message: "Not checked yet" },
  tasks: { loading: false, ok: false, count: null, message: "Not checked yet" },
  agents: { loading: false, ok: false, count: null, message: "Not checked yet" },
  audit: { loading: false, ok: false, count: null, message: "Not checked yet" },
}

const surfaceLabels: Record<SurfaceKey, string> = {
  jobs: "Jobs",
  tasks: "Tasks",
  agents: "Agents",
  audit: "Audit",
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return "Unknown error"
}

export default function SupportPlanPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || ""
  const isBackendMode = Boolean(apiBaseUrl)
  const modeLabel = useMemo(
    () => (isBackendMode ? "Backend API mode" : "Mock fallback mode"),
    [isBackendMode],
  )

  const [checks, setChecks] = useState<Checks>(initialChecks)
  const [isRunning, setIsRunning] = useState(false)
  const [lastRunAt, setLastRunAt] = useState<string>("")

  const runChecks = useCallback(async () => {
    setIsRunning(true)
    setChecks({
      jobs: { loading: true, ok: false, count: null, message: "Checking..." },
      tasks: { loading: true, ok: false, count: null, message: "Checking..." },
      agents: { loading: true, ok: false, count: null, message: "Checking..." },
      audit: { loading: true, ok: false, count: null, message: "Checking..." },
    })

    const [jobs, tasks, agents, audit] = await Promise.allSettled([
      getJobs(),
      getTasks(),
      getAgents(),
      getAudit(),
    ])

    setChecks({
      jobs:
        jobs.status === "fulfilled"
          ? { loading: false, ok: true, count: jobs.value.length, message: "Reachable" }
          : { loading: false, ok: false, count: null, message: getErrorMessage(jobs.reason) },
      tasks:
        tasks.status === "fulfilled"
          ? { loading: false, ok: true, count: tasks.value.length, message: "Reachable" }
          : { loading: false, ok: false, count: null, message: getErrorMessage(tasks.reason) },
      agents:
        agents.status === "fulfilled"
          ? { loading: false, ok: true, count: agents.value.length, message: "Reachable" }
          : { loading: false, ok: false, count: null, message: getErrorMessage(agents.reason) },
      audit:
        audit.status === "fulfilled"
          ? { loading: false, ok: true, count: audit.value.length, message: "Reachable" }
          : { loading: false, ok: false, count: null, message: getErrorMessage(audit.reason) },
    })

    setLastRunAt(new Date().toLocaleString())
    setIsRunning(false)
  }, [])

  return (
    <>
      <PageHeader
        title="Integration Status"
        description="Developer-facing connectivity check for frontend API surfaces. This is a prototype helper, not production monitoring."
      >
        <Badge className="border-transparent bg-accent text-accent-foreground">v0.3f prototype check</Badge>
      </PageHeader>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Runtime mode</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{modeLabel}</Badge>
            {isBackendMode ? <span>Base URL: {apiBaseUrl}</span> : <span>No API base URL configured.</span>}
          </div>
          <p className="text-sm text-muted-foreground">
            In mock fallback mode, checks run against frontend mock API routes. In backend mode, checks run against the standalone backend.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={runChecks} disabled={isRunning}>
              {isRunning ? "Running checks..." : "Run checks"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {lastRunAt ? `Last run: ${lastRunAt}` : "No checks run yet"}
            </p>
          </div>

          <div className="rounded-lg border border-border">
            <div className="grid grid-cols-1 gap-0 divide-y divide-border">
              {(Object.keys(surfaceLabels) as SurfaceKey[]).map((key) => {
                const result = checks[key]
                return (
                  <div key={key} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[140px_140px_1fr] sm:items-center">
                    <p className="font-medium text-foreground">{surfaceLabels[key]}</p>
                    <Badge
                      variant={result.ok ? "default" : "outline"}
                      className={result.ok ? "bg-emerald-600 text-white" : undefined}
                    >
                      {result.loading ? "checking" : result.ok ? "reachable" : "unreachable"}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {result.ok ? `Count: ${result.count ?? 0}` : result.message}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
