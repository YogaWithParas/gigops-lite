"use client"

import { useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePersona } from "@/lib/persona-context"
import { useTour } from "@/lib/tour-context"
import { getTourSteps } from "@/lib/tour-steps"

const SPOTLIGHT_PADDING = 8
const POLL_TIMEOUT_MS = 3000
const POLL_INTERVAL_MS = 120

function getSpotlightStyle(rect: DOMRect | null): CSSProperties {
  if (!rect) {
    return { opacity: 0 }
  }

  return {
    position: "fixed",
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
    borderRadius: 14,
    boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.65)",
    outline: "2px solid var(--primary)",
    outlineOffset: 2,
    transition: "all 300ms ease-out",
    pointerEvents: "none",
  }
}

function getCaptionStyle(rect: DOMRect | null): CSSProperties {
  const cardWidth = 320
  const margin = 16

  if (!rect || typeof window === "undefined") {
    return { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
  }

  const left = Math.min(Math.max(margin, rect.left), window.innerWidth - cardWidth - margin)
  const spaceBelow = window.innerHeight - rect.bottom

  if (spaceBelow > 220) {
    return { position: "fixed", top: rect.bottom + margin, left }
  }

  return { position: "fixed", top: rect.top - margin, left, transform: "translateY(-100%)" }
}

export function TourOverlay() {
  const { isActive, stepIndex, totalSteps, next, back, skip, end } = useTour()
  const { setRole } = usePersona()
  const router = useRouter()
  const pathname = usePathname()
  const steps = getTourSteps(setRole)
  const step = steps[stepIndex]

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [isLocating, setIsLocating] = useState(true)

  useEffect(() => {
    if (!isActive) return
    step.beforeEnter?.()
    if (pathname !== step.route) {
      router.push(step.route)
    }
    // Only re-run when the step changes, not on every pathname update from the push above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, stepIndex])

  useEffect(() => {
    if (!isActive) return

    setIsLocating(true)
    setTargetRect(null)

    if (pathname !== step.route) return

    let cancelled = false
    const startedAt = Date.now()
    let timeoutId: ReturnType<typeof setTimeout>

    function poll() {
      if (cancelled) return

      const el = document.querySelector(step.targetSelector)
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "auto" })
        setTargetRect(el.getBoundingClientRect())
        setIsLocating(false)
        return
      }

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setIsLocating(false)
        return
      }

      timeoutId = setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [isActive, stepIndex, pathname, step.route, step.targetSelector])

  useEffect(() => {
    if (!isActive) return

    function recalc() {
      const el = document.querySelector(step.targetSelector)
      if (el) setTargetRect(el.getBoundingClientRect())
    }

    window.addEventListener("resize", recalc)
    window.addEventListener("scroll", recalc, true)
    return () => {
      window.removeEventListener("resize", recalc)
      window.removeEventListener("scroll", recalc, true)
    }
  }, [isActive, isLocating, step.targetSelector])

  if (!isActive) return null

  const isLastStep = stepIndex === totalSteps - 1

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Guided product tour" aria-modal="true">
      <div style={getSpotlightStyle(targetRect)} aria-hidden="true" />
      {!targetRect ? <div className="fixed inset-0 bg-slate-950/65 transition-opacity" aria-hidden="true" /> : null}

      <div style={getCaptionStyle(targetRect)} className="w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Step {stepIndex + 1} of {totalSteps}
          </p>
          <button
            type="button"
            onClick={end}
            aria-label="End tour"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <h2 className="mt-1 text-base font-semibold text-foreground">{step.title}</h2>

        {isLocating ? (
          <p className="mt-2 text-sm text-muted-foreground">Finding this on the page...</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{step.caption}</p>
        )}

        {isLastStep && !isLocating ? (
          <p className="mt-3 text-sm">
            <Link href="/how-it-works" onClick={end} className="font-medium text-primary underline-offset-4 hover:underline">
              See the full picture →
            </Link>
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={skip}>
            Skip
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={back} disabled={stepIndex === 0}>
              Back
            </Button>
            <Button type="button" size="sm" onClick={isLastStep ? end : next}>
              {isLastStep ? "End tour" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
