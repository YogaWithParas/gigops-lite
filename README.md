# GigOps Lite

GigOps Lite is a Next.js prototype for orchestrating CX and data-labeling gig operations. It models how client work moves through intake, assignment, QA, payouts, and audit tracking with synthetic data and mock APIs.

## Current State

This repository is currently mock-only.

Implemented now:

- App routes for operations workflow
- Synthetic datasets for jobs, tasks, workers, QA, payouts, and audit events
- Mock API handlers under `frontend/app/api/*`
- Role-oriented screens for operations visibility and control

Not implemented yet:

- Persistent database
- Real authentication and authorization enforcement
- Real queueing/event pipeline
- Real payment processing
- Production hosting and observability wiring

## Routes

Primary UI routes:

- `/`
- `/jobs`
- `/tasks`
- `/agents`
- `/quality`
- `/payouts`
- `/audit`

Mock API routes:

- `/api/jobs`
- `/api/tasks`
- `/api/agents`
- `/api/audit`

## Tech Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

## Local Development

```bash
cd frontend
npm install
npm run dev
```

## Build

```bash
cd frontend
npm run build
```

## Architecture: Real vs Planned

Real in this prototype:

- Frontend pages and components
- In-memory synthetic data sources
- Route handlers that simulate backend responses

Planned production architecture:

- Cloud Run for APIs and background workers
- Firestore for operational data persistence
- Pub/Sub for event-driven state transitions
- Auth0 for authentication and RBAC claims
- Cloud Logging and Cloud Monitoring for tracing, metrics, and SLOs

The project is intentionally structured so mock data and mock routes can be replaced incrementally with real services without redesigning the UI flows.
