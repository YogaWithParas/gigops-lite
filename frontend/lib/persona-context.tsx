"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { gigWorkers, jobs } from "@/lib/gig-data"

// Auth0-backed RBAC is planned but not implemented (see docs/auth-rbac.md). This
// context is a mock, client-side-only stand-in so the prototype can demo Client,
// Worker, and Ops views without building real login. It is not a security boundary.
export type PersonaRole = "ops" | "worker" | "client"

const STORAGE_KEY = "gigops-persona"

interface PersonaState {
  role: PersonaRole
  workerId: string
  clientName: string
}

interface PersonaContextValue extends PersonaState {
  setRole: (role: PersonaRole) => void
  setWorkerId: (workerId: string) => void
  setClientName: (clientName: string) => void
}

const defaultState: PersonaState = {
  role: "ops",
  workerId: gigWorkers[0]?.id ?? "",
  clientName: jobs[0]?.clientName ?? "",
}

const PersonaContext = createContext<PersonaContextValue | undefined>(undefined)

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersonaState>(defaultState)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as Partial<PersonaState>
      setState((current) => ({ ...current, ...parsed }))
    } catch {
      // Ignore malformed storage and keep defaults.
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value: PersonaContextValue = {
    ...state,
    setRole: (role) => setState((current) => ({ ...current, role })),
    setWorkerId: (workerId) => setState((current) => ({ ...current, workerId })),
    setClientName: (clientName) => setState((current) => ({ ...current, clientName })),
  }

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
}

export function usePersona() {
  const context = useContext(PersonaContext)
  if (!context) {
    throw new Error("usePersona must be used within a PersonaProvider")
  }
  return context
}
