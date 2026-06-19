"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { auditEvents } from "@/lib/gig-data"
import { getAudit } from "@/lib/api-client"
import type { AuditEvent } from "@/lib/types"

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>(auditEvents)

  useEffect(() => {
    let cancelled = false

    async function loadAudit() {
      try {
        const nextEvents = await getAudit()
        if (cancelled) return

        setEvents(nextEvents)
      } catch (error) {
        if (cancelled) return
        console.error("Failed to load audit events", error)
      }
    }

    loadAudit()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <PageHeader title="Audit" description="Immutable-style synthetic event log for job creation, task assignment, QA, and payouts.">
        <Badge className="border-transparent bg-accent text-accent-foreground">Synthetic audit trail</Badge>
      </PageHeader>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {events.map((event) => (
            <div key={event.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{event.summary}</p>
                  <p className="text-sm text-muted-foreground">{event.eventType} · {event.actor} · {event.timestamp}</p>
                </div>
                <Badge variant="outline">{event.entityType}:{event.entityId}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">{event.details}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}