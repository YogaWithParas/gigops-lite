"use client"

import { useMemo } from "react"
import { CircleDollarSign, Hourglass, WalletCards } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { payouts } from "@/lib/gig-data"
import { usePersona } from "@/lib/persona-context"

function statusTone(status: string) {
  if (status === "paid") return "bg-emerald-100 text-emerald-800"
  if (status === "processing") return "bg-sky-100 text-sky-800"
  return "bg-amber-100 text-amber-800"
}

export default function WorkerPayoutsPage() {
  const { workerId } = usePersona()
  const myPayouts = useMemo(() => payouts.filter((payout) => payout.workerId === workerId), [workerId])

  const queued = myPayouts.filter((payout) => payout.status === "queued").length
  const processing = myPayouts.filter((payout) => payout.status === "processing").length
  const paidTotal = myPayouts
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + payout.amount, 0)

  return (
    <>
      <PageHeader
        title="My Payouts"
        description="Payout status for your approved work. Same synthetic data as the ops Payouts view, scoped to you."
      />

      <section aria-label="My payout metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Queued" value={queued} hint="Awaiting processing" icon={WalletCards} />
        <StatCard label="Processing" value={processing} hint="Moving through batch" icon={Hourglass} />
        <StatCard label="Paid total" value={`$${paidTotal.toFixed(2)}`} hint="Completed transfers" icon={CircleDollarSign} />
      </section>

      <Card className="mt-6">
        <CardContent className="divide-y divide-border p-0">
          {myPayouts.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No payout records for this worker yet.</p>
          ) : (
            myPayouts.map((payout) => (
              <div key={payout.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{payout.taskId}</p>
                    <p className="text-sm text-muted-foreground">Scheduled {payout.scheduledFor}</p>
                  </div>
                  <Badge className={statusTone(payout.status)}>{payout.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-foreground">
                  Amount ${payout.amount.toFixed(2)} · Updated {payout.updatedAt}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}
