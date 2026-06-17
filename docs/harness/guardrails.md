# Guardrails

These guardrails keep agent output safe, honest, and predictable for a prototype codebase.

## Product Truth Guardrail

Always preserve this distinction:

Implemented now:
- Next.js UI
- Mock API handlers
- Synthetic data
- Documentation and local build tooling

Mock or planned only:
- Cloud Run, Firestore, Pub/Sub
- Auth0
- Production observability
- Real audit logging
- Real payout processing

Do not imply planned systems are already live.

## Change Scope Guardrail

- Prefer focused edits over broad rewrites.
- Do not edit unrelated files.
- Do not change route contracts unless asked.

## Dependency Guardrail

- Do not install dependencies unless explicitly requested.
- Do not edit package-lock.json unless dependency changes are explicitly required.

## Infrastructure Guardrail

Do not add production infra integration in routine tasks:
- No real GCP service wiring
- No Auth0 integration
- No production queueing or persistence integration

## Communication Guardrail

Final reports must be explicit:
- What changed
- What passed or failed
- What remains mock/planned

## Readability Guardrail

- Write beginner-readable code and docs.
- Avoid jargon-heavy or over-engineered solutions.
- Keep recruiter-friendliness in mind.
