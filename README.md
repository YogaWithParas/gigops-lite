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
