import type { PersonaRole } from "./persona-context"

export interface TourStep {
  route: string
  targetSelector: string
  title: string
  caption: string
  beforeEnter?: () => void
}

export function getTourSteps(setRole: (role: PersonaRole) => void): TourStep[] {
  return [
    {
      route: "/",
      targetSelector: '[data-tour="attention-card"]',
      title: "Needs your attention",
      caption: "Ops sees what needs attention first, not a wall of numbers.",
    },
    {
      route: "/",
      targetSelector: '[data-tour="task-pipeline-card"]',
      title: "Task pipeline",
      caption: "Every task's stage, visualized instantly — no status reports needed.",
    },
    {
      route: "/queue",
      targetSelector: '[data-tour="kanban-board"]',
      title: "Queue board",
      caption: "Tasks move through stages like a project board.",
    },
    {
      route: "/queue",
      targetSelector: '[data-tour="task-detail-panel"]',
      title: "Assignment reasoning",
      caption: "The assignment engine shows its reasoning, not just its answer.",
    },
    {
      route: "/worker",
      targetSelector: '[data-tour="worker-task-card"]',
      title: "My Tasks",
      caption: "Workers see only their own tasks, with real progress, not a spreadsheet.",
      beforeEnter: () => setRole("worker"),
    },
    {
      route: "/client",
      targetSelector: '[data-tour="job-stepper-card"]',
      title: "My Jobs",
      caption: "Clients see progress without any of the internal operational noise.",
      beforeEnter: () => setRole("client"),
    },
    {
      route: "/client/new",
      targetSelector: '[data-tour="request-job-form"]',
      title: "Request a Job",
      caption: "And the loop closes here — clients can kick off new work anytime.",
    },
  ]
}
