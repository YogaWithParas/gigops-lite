# GigOps Lite Human-in-the-Loop Workflow

## Purpose

GigOps Lite uses synthetic data to model how CX and data-labeling operations can be coordinated with clear human oversight. The goal is to make automated task routing useful without removing human accountability.

## Workflow Stages

1. Job intake
- Admin or operations lead creates a batch in Jobs.
- The batch defines required skills, priority, and due date.

2. Task generation and queueing
- Tasks are represented in a shared queue with status and payout metadata.
- Priority and SLA pressure influence assignment order.

3. Agent assignment
- The assignment layer ranks candidate agents using skill fit, quality history, availability, and workload.
- The system suggests assignments, but operations can reassign when needed.

4. Agent execution
- Agents complete CX or data-labeling work.
- In-progress and handoff states are tracked through the task lifecycle.

5. QA review
- Reviewers approve, request correction, or escalate.
- Escalations and correction loops are explicit and auditable.

6. Payout processing
- Approved work moves into payout queues.
- Finance/admin tracks queued, processing, and paid states.

7. Audit and observability
- Events across jobs, tasks, QA, and payouts are recorded as audit entries.
- These logs support traceability, incident review, and governance.

## Human Controls

Human reviewers remain in control of high-impact decisions:

- accepting or changing assignments
- approving or rejecting QA outcomes
- escalating risk or policy concerns
- finalizing payout eligibility

Automation supports throughput. Humans own final accountability.

## V1 Scope

Current implementation is mock-only:

- synthetic in-memory data
- mock route handlers under `/api/*`
- no external model calls
- no persistent database
- no production auth/permissions

## Future Production Direction

The planned production architecture extends this workflow with:

- Cloud Run services for APIs and workers
- Firestore persistence for operational entities
- Pub/Sub event fanout for state changes
- Auth0-backed RBAC for role-bound actions
- Cloud Logging and Monitoring for SLO visibility

The HITL boundary remains the same in production: recommendations can be automated, approvals and exceptions remain human-governed.