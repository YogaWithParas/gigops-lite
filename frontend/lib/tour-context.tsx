"use client"

import { createContext, useContext, useState } from "react"
import { usePersona } from "./persona-context"
import { getTourSteps } from "./tour-steps"

interface TourContextValue {
  isActive: boolean
  stepIndex: number
  totalSteps: number
  start: () => void
  next: () => void
  back: () => void
  skip: () => void
  end: () => void
}

const TourContext = createContext<TourContextValue | undefined>(undefined)

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { setRole } = usePersona()
  const [isActive, setIsActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const totalSteps = getTourSteps(setRole).length

  function start() {
    setRole("ops")
    setStepIndex(0)
    setIsActive(true)
  }

  function next() {
    setStepIndex((current) => Math.min(current + 1, totalSteps - 1))
  }

  function back() {
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  function end() {
    setRole("ops")
    setIsActive(false)
    setStepIndex(0)
  }

  function skip() {
    end()
  }

  const value: TourContextValue = { isActive, stepIndex, totalSteps, start, next, back, skip, end }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error("useTour must be used within a TourProvider")
  }
  return context
}
