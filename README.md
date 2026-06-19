# GigOps Lite

GigOps Lite is a Next.js proof-of-work prototype for orchestrating CX and data-labeling gig operations. It models how client work moves through intake, assignment, agent task completion, QA review, payout tracking, and audit visibility using synthetic data and mock APIs.

**Live Demo:** https://gigops-lite.vercel.app
**GitHub Repo:** https://github.com/YogaWithParas/gigops-lite

## Project Purpose

This project was built to demonstrate product-minded full-stack engineering for gig-work, CX, and human-in-the-loop data-labeling operations.

In simple terms:

```text
Clients create work
→ tasks are assigned
→ agents complete tasks
→ QA reviewers approve or reject work
→ payouts are tracked
→ audit events record key actions
```

## Current State

This repository is currently a frontend + mock API prototype.

## Demo Readiness (v0.3f)

### What GigOps Lite Is

GigOps Lite is a recruiter-friendly proof-of-work prototype showing how CX and data-labeling operations can be orchestrated across jobs, tasks, agents, QA, payouts, and audit events.

### Real vs Mock (Technically Honest)

Real now:

* Frontend app deployed on Vercel: https://gigops-lite.vercel.app
* Standalone local backend API under `api/` (Express + TypeScript)
* Frontend API client supports two runtime modes:
	* Mock fallback mode (default)
	* Backend API mode (when `NEXT_PUBLIC_API_BASE_URL` is set)
* Backend smoke test harness (`npm run smoke:test` in `api/`)

Mock or planned:

* In-memory synthetic data (resets on restart)
* No persistent database yet
* No authentication or authorization yet
* Backend is not deployed yet (local-only)

### Runtime Modes

Mock fallback mode:

* Used when `NEXT_PUBLIC_API_BASE_URL` is not set
* Frontend reads from Next.js mock routes (`/api/jobs`, `/api/tasks`, `/api/agents`, `/api/audit`)

Backend API mode:

* Used when `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`
* Frontend reads from the standalone local backend

### Run Frontend in Mock Fallback Mode

PowerShell:

```powershell
cd C:\dev\gigops-prototype\frontend
Remove-Item Env:NEXT_PUBLIC_API_BASE_URL -ErrorAction SilentlyContinue
npm run dev
```

### Run Frontend with Local Backend Mode

Terminal A (backend):

```powershell
cd C:\dev\gigops-prototype\api
npm run dev
```

Terminal B (frontend):

```powershell
cd C:\dev\gigops-prototype\frontend
$env:NEXT_PUBLIC_API_BASE_URL='http://localhost:4000'
npm run dev
```

### Run Backend Smoke Tests

```powershell
cd C:\dev\gigops-prototype\api
$env:BASE_URL='http://localhost:4000'
npm run smoke:test
```

### Manual Demo Checklist

With frontend running, verify:

* `/jobs` loads and reflects current mode data source.
* `/tasks` loads and task assignment action works.
* `/agents` loads and displays worker availability and profile cards.
* `/audit` loads and shows audit events.
* `/integration-status` shows mode, base URL (when set), and reachability checks for jobs/tasks/agents/audit.
* In backend mode, task assignment is sent to `POST /tasks/:id/assign` and updates the selected task in the UI.

### Known Limitations

* Data is in-memory and resets when services restart.
* No persistent database yet.
* No authentication or RBAC enforcement yet.
* Backend API is local-only and not deployed yet.
* This status surface is for demo/developer verification, not production monitoring.

### Next Planned Milestones

* v0.4: complete integration pass for remaining frontend workflows using the same safe API-client pattern.
* v0.5: introduce persistence layer planning and implementation path (still local-first).
* v0.6: prepare backend deployment readiness plan (auth, observability, and reliability gates) before production rollout.

## v0.2 Backend API Milestone

GigOps Lite now includes a standalone Express + TypeScript API service under `api/`.

Implemented in v0.2:

* `GET /health`
* `GET /jobs?page=1&limit=10`
* `POST /jobs`
* `GET /tasks?page=1&limit=10`
* `POST /tasks/:id/assign`
* `GET /agents`
* `GET /audit`
* Request IDs in every response
* Pagination metadata for list endpoints
* Structured error responses
* Zod validation
* Idempotency simulation for `POST /jobs`
* Task assignment simulation with `POST /tasks/:id/assign`

Validated locally:

* `POST /jobs` creates a job on first request
* Replaying the same `Idempotency-Key` with the same payload returns the same job without duplication
* Reusing the same `Idempotency-Key` with a different payload returns an idempotency conflict
* `POST /tasks/TASK-2002/assign` assigns a task to agent `AG-002`

Still mock/planned:

* Firestore persistence
* Auth0 RBAC
* Pub/Sub events
* GCP Cloud Run deployment
* Production observability

### Implemented Now

* Next.js App Router frontend
* Role-oriented operational screens
* Synthetic datasets for jobs, tasks, agents, QA reviews, payouts, and audit events
* Mock API route handlers under `frontend/app/api/*`
* Route smoke test script for UI and API endpoints
* Legacy-term scan script to catch leftover PEAK-Lite / education content
* Agentic engineering harness with specs, guardrails, review checklist, and definition of done
* Deployed frontend on Vercel

### Mock / Planned

* Persistent database
* Real authentication and authorization enforcement
* Real queueing / event pipeline
* Real payment processing
* GCP Cloud Run backend services
* Firestore persistence
* Pub/Sub event-driven workflows
* Auth0 RBAC integration
* Production-grade observability, tracing, and SLO monitoring

## Routes

### Primary UI Routes

```text
/
 /jobs
 /tasks
 /agents
 /quality
 /payouts
 /audit
```

### Mock API Routes

```text
/api/jobs
/api/tasks
/api/agents
/api/audit
```

## Tech Stack

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* Mock API route handlers
* Synthetic data
* Vercel deployment

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build and Type Check

```bash
cd frontend
npm run verify
```

This runs:

```text
npm run build
npm run typecheck
```

## Route Smoke Test

Start the local dev server:

```bash
cd frontend
npm run dev
```

In a second terminal:

```bash
cd frontend
npm run test:routes
```

To test the deployed Vercel app:

```bash
cd frontend
BASE_URL=https://gigops-lite.vercel.app npm run test:routes
```

On Windows PowerShell:

```powershell
cd frontend
$env:BASE_URL='https://gigops-lite.vercel.app'
npm run test:routes
```

## Legacy Scan

```bash
cd frontend
npm run scan:legacy
```

This checks source and documentation folders for old PEAK-Lite / education-related terms.

## Architecture: Real vs Planned

### Real in This Prototype

```text
Next.js frontend
→ mock route handlers
→ synthetic in-memory data
→ Vercel-hosted frontend
```

### Planned Production Architecture

```text
Next.js frontend
→ Node.js / TypeScript API services
→ GCP Cloud Run
→ Firestore
→ Cloud Storage
→ Pub/Sub
→ Auth0
→ Cloud Logging / Monitoring / Trace
```

The project is intentionally structured so mock data and mock routes can be replaced incrementally with real services without redesigning the user workflow.

## Agentic Engineering Harness

This repository includes an agentic engineering harness to support disciplined AI-assisted development.

Key files:

```text
AGENTS.md
docs/harness/agent-workflow.md
docs/harness/guardrails.md
docs/harness/review-checklist.md
docs/harness/definition-of-done.md
docs/harness/task-template.md
docs/specs/v0.1-frontend-mock-api.md
```

The harness defines:

* project intent
* real vs mock boundaries
* allowed edit areas
* stop conditions for coding agents
* review checklist
* definition of done
* validation commands

The goal is to practice agentic engineering rather than unstructured vibe coding: specs first, bounded tasks, tests, guardrails, and human review.

## Why This Project Matters

GigOps Lite demonstrates how a gig operations platform could coordinate CX and data-labeling work across clients, agents, QA reviewers, and administrators. It focuses on the operational backbone behind human-in-the-loop AI workflows: assignment, review, payout tracking, auditability, and reliability.

This is not a production system yet. It is a deliberately scoped prototype showing product thinking, frontend execution, API design, cloud-readiness, and engineering discipline.
