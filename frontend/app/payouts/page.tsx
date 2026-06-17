"use client"

import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { payouts } from "@/lib/gig-data"
import { CircleDollarSign, Hourglass, WalletCards } from "lucide-react"

function statusTone(status: string) {
  if (status === "paid") return "bg-emerald-100 text-emerald-800"
  if (status === "processing") return "bg-sky-100 text-sky-800"
  return "bg-amber-100 text-amber-800"
}

export default function PayoutsPage() {
  const queued = payouts.filter((payout) => payout.status === "queued").length
  const processing = payouts.filter((payout) => payout.status === "processing").length
  const paid = payouts.filter((payout) => payout.status === "paid").length
  const total = payouts.reduce((sum, payout) => sum + payout.amount, 0)

  return (
    <>
      <PageHeader title="Payouts" description="Synthetic payout simulation showing approved tasks, queue status, and daily totals.">
        <Badge className="border-transparent bg-accent text-accent-foreground">Mock payout flow</Badge>
      </PageHeader>

      <section aria-label="Payout metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Queued" value={queued} hint="Awaiting processing" icon={WalletCards} />
        <StatCard label="Processing" value={processing} hint="Moving through batch" icon={Hourglass} />
        <StatCard label="Paid" value={paid} hint="Completed transfers" icon={CircleDollarSign} />
        <StatCard label="Daily total" value={`$${total.toFixed(2)}`} hint="Synthetic dollar amount" icon={CircleDollarSign} />
      </section>

      <Card className="mt-6">
        <CardContent className="divide-y divide-border p-0">
          {payouts.map((payout) => (
            <div key={payout.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{payout.taskId}</p>
                  <p className="text-sm text-muted-foreground">Worker {payout.workerId} · {payout.scheduledFor}</p>
                </div>
                <Badge className={statusTone(payout.status)}>{payout.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-foreground">Amount ${payout.amount.toFixed(2)} · Updated {payout.updatedAt}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}