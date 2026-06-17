"use client"

import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { qaQueue } from "@/lib/gig-data"
import { CheckCircle2, CircleAlert, ShieldCheck } from "lucide-react"

function outcomeTone(outcome: string) {
  if (outcome === "approved") return "bg-emerald-100 text-emerald-800"
  if (outcome === "correction-needed") return "bg-amber-100 text-amber-800"
  return "bg-rose-100 text-rose-800"
}

export default function QualityPage() {
  const approved = qaQueue.filter((item) => item.outcome === "approved").length
  const corrections = qaQueue.filter((item) => item.outcome === "correction-needed").length
  const escalated = qaQueue.filter((item) => item.outcome === "escalated").length

  return (
    <>
      <PageHeader title="Quality" description="QA review queue for synthetic task approvals, correction-needed feedback, and escalations.">
        <Badge className="border-transparent bg-accent text-accent-foreground">No real review backend</Badge>
      </PageHeader>

      <section aria-label="QA metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Approved" value={approved} hint="Ready for payout" icon={CheckCircle2} />
        <StatCard label="Correction needed" value={corrections} hint="Needs worker follow-up" icon={CircleAlert} />
        <StatCard label="Escalated" value={escalated} hint="Requires senior review" icon={ShieldCheck} />
      </section>

      <Card className="mt-6">
        <CardContent className="divide-y divide-border p-0">
          {qaQueue.map((item) => (
            <div key={item.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{item.taskId}</p>
                  <p className="text-sm text-muted-foreground">{item.reviewer} · {item.updatedAt}</p>
                </div>
                <Badge className={outcomeTone(item.outcome)}>{item.outcome}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">{item.reason}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}