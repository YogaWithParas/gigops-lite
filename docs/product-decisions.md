# GigOps Lite Product and Architecture Decisions

## Overview

GigOps Lite is designed as an operations prototype for high-volume CX and data-labeling work. The main product decisions prioritize throughput, reviewability, and clear ownership boundaries across operations, agents, QA, and admin teams.

## Decision 1: Workflow-Centered UI

The product is organized around operational workflow states instead of persona-only dashboards.

Why:

- makes queue health visible at each stage
- reduces handoff ambiguity
- aligns UI directly with operational outcomes

## Decision 2: Mock-First Backend Contract

The current version uses synthetic datasets and mock route handlers.

Why:

- enables fast iteration on UX and data contracts
- isolates product decisions from infrastructure lead time
- provides deterministic demo behavior for validation

## Decision 3: Explicit Human-in-the-Loop Boundaries

Assignment and ranking can be automated, but high-impact decisions stay human-controlled.

Why:

- keeps accountability with named roles
- supports escalation paths and exception handling
- avoids black-box operational behavior

## Decision 4: Auditability as a First-Class Concern

Audit events are modeled as product entities, not just logs.

Why:

- enables incident reconstruction
- improves trust in operational decisions
- supports compliance-oriented reporting paths later

## Decision 5: Score-Based Assignment, Not Opaque Selection

The assignment layer uses weighted scoring signals such as skill fit, quality score, availability, and workload.

Why:

- exposes assignment rationale
- allows incremental tuning without system redesign
- supports future explainability requirements

## Decision 6: Data Model Built for Event Evolution

Entities are separated into jobs, tasks, workers, QA items, payouts, and audit events.

Why:

- reduces schema coupling
- maps cleanly to event-driven architecture
- supports independent scaling of pipeline stages

## Decision 7: Production Target on GCP

The intended production topology is Cloud Run + Firestore + Pub/Sub with Auth0 and Cloud observability.

Why:

- managed services reduce operational overhead
- pub/sub decouples high-volume transitions
- cloud-native telemetry supports SLO-driven operations

## Summary

GigOps Lite intentionally favors operational clarity over feature sprawl. The current mock-first implementation validates core orchestration flows now, while preserving a direct migration path to production infrastructure later.
