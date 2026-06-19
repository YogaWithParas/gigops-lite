import Link from "next/link"
import {
  BriefcaseBusiness,
  ListTodo,
  ShieldCheck,
  WalletCards,
  Activity,
  ArrowRight,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auditEvents, gigWorkers, jobs, payouts, qaQueue, tasks } from "@/lib/gig-data"
import type { AuditEvent } from "@/lib/types"

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

export default function DashboardPage() {
  const activeJobs = jobs.filter((job) => job.status !== "complete").length
  const openTasks = tasks.filter((task) => task.status === "queued" || task.status === "assigned").length
  const qaPassRate = Math.round((qaQueue.filter((review) => review.outcome === "approved").length / qaQueue.length) * 100)
  const payoutQueue = payouts.filter((payout) => payout.status !== "paid").length
  const healthySlos = 3

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="GigOps Lite is a prototype platform for orchestrating CX, data-labeling, and human-in-the-loop AI tasks across clients, agents, QA reviewers, and admins."
      >
        <Button asChild>
          <Link href="/jobs">
            <BriefcaseBusiness className="size-4" aria-hidden="true" />
            Review jobs
          </Link>
        </Button>
      </PageHeader>

      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active jobs"
          value={activeJobs}
          hint="Open or in-flight batches"
          icon={BriefcaseBusiness}
        />
        <StatCard
          label="Open tasks"
          value={openTasks}
          hint="Awaiting assignment or in queue"
          icon={ListTodo}
        />
        <StatCard
          label="QA pass rate"
          value={`${qaPassRate}%`}
          hint="Approved in the current review queue"
          icon={ShieldCheck}
        />
        <StatCard
          label="Payout queue"
          value={payoutQueue}
          hint="Approved but not yet paid"
          icon={WalletCards}
        />
      </section>

      <section aria-label="SLO summary" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">SLO status</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{healthySlos}/3 healthy</p>
            <p className="mt-1 text-xs text-muted-foreground">Task latency, QA freshness, and payout lag remain within target.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Workers online</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{gigWorkers.filter((worker) => worker.availability === "available").length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Available across multiple regions and time zones.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">QA queue</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{qaQueue.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Correction-needed and escalated reviews awaiting action.</p>
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent audit events</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {auditEvents.map((item) => {
                const Icon = eventIcons[item.eventType]
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 py-3 not-last:border-b not-last:border-border"
                  >
                    <span
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
                      aria-hidden="true"
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-relaxed text-foreground">{item.summary}</p>
                      <p className="text-xs text-muted-foreground">{item.eventType} · {item.timestamp}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="flex flex-col bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-primary-foreground">Synthetic prototype</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-6">
            <p className="text-sm leading-relaxed text-primary-foreground/90">
              This workspace simulates client job intake, task assignment, QA review, and payout orchestration. It is safe to explore and uses synthetic data.
            </p>
            <Button asChild variant="secondary" className="w-full justify-between">
              <Link href="/tasks">
                Open task queue
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
