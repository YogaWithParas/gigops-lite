import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowFlag } from "@/lib/workflow-stages"

const flagToneStyle: Record<WorkflowFlag["tone"], string> = {
  warning: "bg-amber-100 text-amber-800",
  urgent: "bg-rose-100 text-rose-800",
}

export function WorkflowStepper({
  stages,
  currentIndex,
  flag,
  subLabel,
}: {
  stages: { key: string; label: string }[]
  currentIndex: number
  flag?: WorkflowFlag
  subLabel?: string
}) {
  return (
    <div>
      <ol className="flex items-center" aria-label="Workflow stage">
        {stages.map((stage, index) => {
          const isDone = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <li key={stage.key} className="flex flex-1 items-center last:flex-none" aria-current={isCurrent ? "step" : undefined}>
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors duration-300",
                    isDone && "border-emerald-500 bg-emerald-500 text-white",
                    isCurrent && !isDone && "border-primary bg-primary text-primary-foreground animate-[stepper-pop_400ms_ease-out]",
                    !isDone && !isCurrent && "border-border bg-card text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  {isDone ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span className={cn("whitespace-nowrap text-center text-xs font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>
                  {stage.label}
                </span>
              </div>
              {index < stages.length - 1 ? (
                <span
                  className={cn(
                    "mx-1 h-0.5 flex-1 rounded-full transition-all duration-500 ease-out",
                    isDone ? "bg-emerald-500" : "bg-border",
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          )
        })}
      </ol>
      {flag || subLabel ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {flag ? (
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", flagToneStyle[flag.tone])}>
              {flag.label}
            </span>
          ) : null}
          {subLabel ? <span className="text-xs text-muted-foreground">{subLabel}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
