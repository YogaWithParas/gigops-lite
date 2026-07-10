import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Severity = "urgent" | "warning"

const severityStyle: Record<Severity, string> = {
  urgent: "bg-rose-100 text-rose-800",
  warning: "bg-amber-100 text-amber-800",
}

export function AttentionCard({
  icon: Icon,
  severity,
  title,
  description,
  meta,
  href,
}: {
  icon: LucideIcon
  severity: Severity
  title: string
  description: string
  meta?: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-foreground">{title}</p>
          <Badge className={severityStyle[severity]}>{severity}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {meta ? <p className="mt-1 text-xs text-muted-foreground">{meta}</p> : null}
      </div>
      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}
