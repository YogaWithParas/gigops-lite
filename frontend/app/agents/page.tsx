"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TagList } from "@/components/tag-list"
import { CapacityBar } from "@/components/capacity-bar"
import { gigWorkers } from "@/lib/gig-data"
import { getAgents } from "@/lib/api-client"
import { Building2, Languages, ShieldCheck, UsersRound } from "lucide-react"

export default function AgentsPage() {
  const [workers, setWorkers] = useState(gigWorkers)

  useEffect(() => {
    let cancelled = false

    async function loadAgents() {
      try {
        const nextWorkers = await getAgents()
        if (cancelled) return

        setWorkers(nextWorkers)
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

  const available = workers.filter((worker) => worker.availability === "available").length
  const busy = workers.filter((worker) => worker.availability === "busy").length
  const offline = workers.filter((worker) => worker.availability === "offline").length
  const avgQuality = Math.round(workers.reduce((sum, worker) => sum + worker.qualityScore, 0) / workers.length)

  return (
    <>
      <PageHeader title="Agents" description="Worker profiles for synthetic gig operations. Skills, availability, and quality guide task assignment.">
        <Badge className="border-transparent bg-accent text-accent-foreground">Synthetic workforce</Badge>
      </PageHeader>

      <section aria-label="Agent metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available" value={available} hint="Ready for assignment" icon={UsersRound} />
        <StatCard label="Busy" value={busy} hint="Currently loaded" icon={Building2} />
        <StatCard label="Offline" value={offline} hint="Not dispatchable" icon={ShieldCheck} />
        <StatCard label="Average quality" value={`${avgQuality}%`} hint="Synthetic quality score" icon={Languages} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {workers.map((worker) => (
          <Card key={worker.id} className="h-full">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{worker.name}</h2>
                    <p className="text-sm text-muted-foreground">{worker.role} · {worker.region} · {worker.timezone}</p>
                  </div>
                  <Badge>{worker.availability}</Badge>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{worker.bio}</p>
              </div>
              <TagList label="Skills" items={worker.skills} variant="need" />
              <TagList label="Languages" items={worker.languages} />
              <CapacityBar current={worker.workload} capacity={worker.maxWorkload} />
              <p className="text-sm text-muted-foreground">Quality score: {worker.qualityScore}% · Hourly rate: ${worker.hourlyRate}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}