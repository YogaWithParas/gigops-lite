"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  BriefcaseBusiness,
  ListTodo,
  UsersRound,
  ShieldCheck,
  WalletCards,
  FileClock,
  Activity,
  LayoutGrid,
  ClipboardList,
  Compass,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePersona, type PersonaRole } from "@/lib/persona-context"

const opsNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/queue", label: "Queue", icon: LayoutGrid },
  { href: "/agents", label: "Agents", icon: UsersRound },
  { href: "/quality", label: "Quality", icon: ShieldCheck },
  { href: "/payouts", label: "Payouts", icon: WalletCards },
  { href: "/audit", label: "Audit", icon: FileClock },
  { href: "/integration-status", label: "Status", icon: Activity },
]

const workerNavItems = [
  { href: "/worker", label: "My Tasks", icon: ListTodo },
  { href: "/worker/payouts", label: "My Payouts", icon: WalletCards },
]

const clientNavItems = [
  { href: "/client", label: "My Jobs", icon: BriefcaseBusiness },
  { href: "/client/new", label: "Request a Job", icon: ClipboardList },
]

const navItemsByRole: Record<PersonaRole, typeof opsNavItems> = {
  ops: opsNavItems,
  worker: workerNavItems,
  client: clientNavItems,
}

const roleLabels: Record<PersonaRole, string> = {
  ops: "Ops",
  worker: "Worker",
  client: "Client",
}

function RoleSwitcher() {
  const { role, setRole } = usePersona()

  return (
    <div className="flex items-center gap-1 rounded-lg bg-sidebar-accent p-1" role="group" aria-label="Viewing as">
      {(Object.keys(roleLabels) as PersonaRole[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setRole(option)}
          aria-pressed={role === option}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            role === option
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent-foreground/10",
          )}
        >
          {roleLabels[option]}
        </button>
      ))}
    </div>
  )
}

function NavLinks({ items, onNavigate }: { items: typeof opsNavItems; onNavigate?: () => void }) {
  const pathname = usePathname()

  if (items.length === 0) {
    return <p className="px-3 text-sm text-muted-foreground">This view is coming in a future update.</p>
  }

  return (
    <nav className="flex flex-col gap-1" aria-label="Main navigation">
      {items.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function MetaLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-1 border-t border-sidebar-border pt-3">
      <Link
        href="/how-it-works"
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <Compass className="size-4 shrink-0" aria-hidden="true" />
        How it works
      </Link>
    </div>
  )
}

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BriefcaseBusiness className="size-5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-base font-semibold text-sidebar-foreground">GigOps Lite</span>
        <span className="text-xs text-muted-foreground">Synthetic CX and data work</span>
      </span>
    </Link>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { role } = usePersona()
  const navItems = navItemsByRole[role]

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="px-2 py-3">
          <Brand />
        </div>
        <div className="mt-2 px-2">
          <RoleSwitcher />
        </div>
        <div className="mt-4 flex-1">
          <NavLinks items={navItems} />
        </div>
        <MetaLinks />
        <div className="mt-3 rounded-lg bg-sidebar-accent p-3 text-xs leading-relaxed text-muted-foreground">
          Prototype only. All jobs, tasks, reviews, and payouts are synthetic and reset on refresh.
        </div>
      </aside>

      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </header>

      {mobileOpen && (
        <div className="space-y-3 border-b border-border bg-sidebar px-4 py-3 lg:hidden">
          <RoleSwitcher />
          <NavLinks items={navItems} onNavigate={() => setMobileOpen(false)} />
          <MetaLinks onNavigate={() => setMobileOpen(false)} />
        </div>
      )}

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}
