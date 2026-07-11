export function StageFunnel({
  stages,
}: {
  stages: { key: string; label: string; count: number }[]
}) {
  const maxCount = Math.max(1, ...stages.map((stage) => stage.count))

  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const widthPct = stage.count === 0 ? 0 : Math.max((stage.count / maxCount) * 100, 4)

        return (
          <div key={stage.key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-medium text-muted-foreground">{stage.label}</span>
            <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted">
              <div className="h-full rounded-md bg-primary transition-all" style={{ width: `${widthPct}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">{stage.count}</span>
          </div>
        )
      })}
    </div>
  )
}
