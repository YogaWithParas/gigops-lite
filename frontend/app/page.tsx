"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity,
  BriefcaseBusiness,
  CheckCircle2,
  ListTodo,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  UsersRound,
  WalletCards,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { AttentionCard } from "@/components/attention-card"
import { CapacityBar } from "@/components/capacity-bar"
import { FilterSelect, ALL_VALUE } from "@/components/filter-select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAgents, getAudit, getTasks } from "@/lib/api-client"
import type { AuditEvent, GigWorker, TaskItem } from "@/lib/types"

const eventIcons: Record<AuditEvent["eventType"], typeof CheckCircle2> = {
  "job.created": BriefcaseBusiness,
  "job.reviewed": Activity,
  "task.assigned": ListTodo,
  "task.reassigned": TriangleAlert,
  "task.unassigned": TriangleAlert,
  "task.review_started": Activity,
  "task.approved": CheckCircle2,
  "task.correction_needed": TriangleAlert,
  "task.escalated": ShieldCheck,
  "qa.approved": CheckCircle2,
  "qa.correction_needed": TriangleAlert,
  "qa.escalated": ShieldCheck,
  "payout.queued": WalletCards,
  "payout.paid": WalletCards,
}

const entityTypeOptions: AuditEvent["entityType"][] = ["job", "task", "worker", "review", "payout"]

export default function DashboardPage() {
  const isBackendMode = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL?.trim())
  const [tasksData, setTasksData] = useState<TaskItem[]>([])
  const [agentsData, setAgentsData] = useState<GigWorker[]>([])
  const [auditData, setAuditData] = useState<AuditEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [entityFilter, setEntityFilter] = useState(ALL_VALUE)

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setIsLoading(true)
      setLoadError("")

      try {
        const [tasks, agents, audit] = await Promise.all([getTasks(), getAgents(), getAudit()])
        if (cancelled) return

        setTasksData(tasks)
        setAgentsData(agents)
        setAuditData(audit)
      } catch (error) {
        if (cancelled) return
        console.error("Failed to load dashboard", error)
        setLoadError(error instanceof Error ? error.message : "Failed to load dashboard data")
      } finally {
        if (cancelled) return
        setIsLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const agentsWithLoad = useMemo(
    () =>
      agentsData.map((agent) => {
        const activeTaskCount = tasksData.filter(
          (task) => task.assignedWorkerId === agent.id && (task.status === "assigned" || task.status === "in_review"),
        ).length
        return { ...agent, activeTaskCount }
      }),
    [agentsData, tasksData],
  )

  const openTasks = tasksData.filter(
    (task) => task.status === "queued" || task.status === "assigned" || task.status === "in_review",
  ).length
  const escalatedTasks = tasksData.filter((task) => task.status === "escalated")
  const correctionTasks = tasksData.filter((task) => task.status === "correction_needed")
  const needsAttentionCount = escalatedTasks.length + correctionTasks.length

  const attentionItems = useMemo(() => {
    const escalatedItems = escalatedTasks.map((task) => ({
      key: `escalated-${task.id}`,
      icon: ShieldAlert,
      severity: "urgent" as const,
      title: task.title,
      description: `Escalated · ${task.id} · ${task.priority} priority`,
      meta: task.assignedWorkerId ? `Assigned to ${task.assignedWorkerId}` : "Unassigned",
      href: `/queue?taskId=${task.id}`,
    }))

    const correctionItems = correctionTasks.map((task) => ({
      key: `correction-${task.id}`,
      icon: TriangleAlert,
      severity: "warning" as const,
      title: task.title,
      description: `Correction needed · ${task.id} · ${task.priority} priority`,
      meta: task.assignedWorkerId ? `Assigned to ${task.assignedWorkerId}` : "Unassigned",
      href: `/queue?taskId=${task.id}`,
    }))

    const overloadedItems = agentsWithLoad
      .filter((agent) => agent.activeTaskCount >= 3)
      .map((agent) => ({
        key: `overloaded-${agent.id}`,
        icon: UsersRound,
        severity: "warning" as const,
        title: `${agent.name} is overloaded`,
        description: `${agent.activeTaskCount} active assigned/review tasks`,
        meta: agent.role,
        href: "/agents",
      }))

    return [...escalatedItems, ...correctionItems, ...overloadedItems].slice(0, 6)
  }, [agentsWithLoad, correctionTasks, escalatedTasks])

  const filteredAuditEvents = useMemo(() => {
    const filtered =
      entityFilter === ALL_VALUE ? auditData : auditData.filter((event) => event.entityType === entityFilter)

    return [...filtered]
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .slice(0, 10)
  }, [auditData, entityFilter])

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Operations view for GigOps Lite: triage, KPIs, agent capacity, and activity in one place."
      >
        <Badge className="border-transparent bg-accent text-accent-foreground">
          {isBackendMode ? "Live data via standalone backend" : "Mock fallback data"}
        </Badge>
      </PageHeader>

      {loadError ? (
        <p role="alert" className="text-sm text-rose-700">
          {loadError}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Needs your attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading triage items...</p> : null}
          {!isLoading && attentionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
          ) : null}
          {attentionItems.map((item) => (
            <AttentionCard
              key={item.key}
              icon={item.icon}
              severity={item.severity}
              title={item.title}
              description={item.description}
              meta={item.meta}
              href={item.href}
            />
          ))}
        </CardContent>
      </Card>

      <section aria-label="Key metrics" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Needs attention" value={needsAttentionCount} hint="Escalated + correction needed" icon={ShieldAlert} />
        <StatCard label="Escalated" value={escalatedTasks.length} hint="Requires special handling" icon={ShieldCheck} />
        <StatCard label="Correction needed" value={correctionTasks.length} hint="Needs another pass" icon={TriangleAlert} />
        <StatCard label="Open tasks" value={openTasks} hint="Queued, assigned, or in review" icon={ListTodo} />
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Agent capacity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading agent capacity...</p> : null}
          {!isLoading && agentsWithLoad.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agents available.</p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agentsWithLoad.map((agent) => (
              <div key={agent.id} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium text-foreground">{agent.name}</p>
                <p className="text-xs text-muted-foreground">
                  {agent.role} · {agent.region}
                </p>
                <div className="mt-3">
                  <CapacityBar current={agent.activeTaskCount} capacity={3} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle>Activity feed</CardTitle>
          <div className="w-full sm:w-56">
            <FilterSelect
              id="activity-entity-filter"
              label="Filter by entity"
              value={entityFilter}
              onValueChange={setEntityFilter}
              options={entityTypeOptions}
              allLabel="All entities"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading activity...</p> : null}
          {!isLoading && filteredAuditEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit events match this filter.</p>
          ) : null}
          <ul className="flex flex-col">
            {filteredAuditEvents.map((event) => {
              const Icon = eventIcons[event.eventType]
              return (
                <li key={event.id} className="flex items-start gap-3 py-3 not-last:border-b not-last:border-border">
                  <span
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
                    aria-hidden="true"
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed text-foreground">{event.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.eventType} · {event.entityType} · {event.timestamp}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        Looking for the full board?{" "}
        <Link href="/queue" className="font-medium text-primary underline-offset-4 hover:underline">
          Open the task queue board
        </Link>
        .
      </p>
    </>
  )
}
