# Agent Harness for GigOps Lite

This file defines how AI coding agents should work in this repository.

## Project Summary

GigOps Lite is a Next.js + TypeScript proof-of-work prototype for a gig-work, CX, and data-labeling orchestration platform.

Implemented now:
- Next.js UI
- Mock API route handlers
- Synthetic data
- Documentation
- Route smoke test
- GitHub repository

Planned or mock only:
- GCP Cloud Run
- Firestore
- Pub/Sub
- Auth0
- Real observability stack
- Production audit-grade logging
- Real payout processing

## Agent Mission

Ship small, safe, readable changes that improve quality while preserving current product behavior.

## Required Workflow

1. Perceive
- Inspect related files before editing.
- Confirm what is real vs mock in current scope.

2. Plan
- List files to edit.
- Prefer minimal changes over rewrites.

3. Act
- Implement the smallest useful change.
- Keep code beginner-readable and recruiter-friendly.

4. Validate
- Run checks required for the task.
- For frontend work, default to:
  - npm run verify
  - npm run scan:legacy

5. Report
- Summarize files changed, commands run, and results.
- State what remains mock/planned.

## Guardrails

- Do not silently change UI routes.
- Do not silently change API route behavior.
- Do not install dependencies unless explicitly requested.
- Do not edit package-lock.json unless dependency changes are explicitly required.
- Do not add production infra or auth wiring in prototype tasks.

## Editing Scope

Primary product source locations:
- frontend/app
- frontend/components
- frontend/lib
- frontend/scripts
- docs
- README.md

Avoid editing generated artifacts and dependency folders.

## Communication Standard

Each final update should include:
- Files created
- Files changed
- Commands run
- Pass or fail status
- Remaining mock or planned areas
