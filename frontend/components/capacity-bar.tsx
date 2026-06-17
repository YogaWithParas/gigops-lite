import { cn } from "@/lib/utils"

export function CapacityBar({
  current,
  capacity,
}: {
  current: number
  capacity: number
}) {
  const pct = capacity > 0 ? Math.min((current / capacity) * 100, 100) : 0
  const full = current >= capacity
  const free = Math.max(capacity - current, 0)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium uppercase tracking-wide text-muted-foreground">
          Current load
        </span>
        <span className="font-medium text-foreground">
          {current} / {capacity}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-label={`Current load: ${current} of ${capacity} workers`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            full ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {full ? "At capacity" : `${free} slot${free === 1 ? "" : "s"} available`}
      </p>
    </div>
  )
}
