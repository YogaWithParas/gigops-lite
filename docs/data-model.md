# GigOps Lite Data Model

GigOps Lite is a synthetic prototype. The model below describes mock data shapes used by the frontend and planned backend boundaries for future Cloud Run, Firestore, Pub/Sub, Cloud Storage, Auth0, and Cloud Logging integration.

## Core Entities

- Job batch: a client request for CX or data-labeling work.
- Task: a unit of work assigned to a gig worker.
- Gig worker: a synthetic worker profile with skills, availability, workload, and quality score.
- QA review: the review decision applied to a task.
- Payout record: the payment state for an approved task.
- Audit event: the traceable event log for all orchestration actions.

## Job Batch

Represents a client-facing batch that groups tasks and tracks operational readiness.

- id
- clientName
- title
- type: `cx` or `data-labeling`
- priority: `low`, `normal`, `high`, `urgent`
- status: `draft`, `queued`, `in_progress`, `qa`, `complete`, `paused`
- taskCount
- completedTaskCount
- qaPassRate
- dueDate
- createdAt
- notes
- requiredSkills

## Task

Represents a single dispatchable unit of work.

- id
- jobId
- title
- type
- priority
- status: `queued`, `assigned`, `in_review`, `approved`, `correction_needed`, `escalated`, `queued_for_payout`, `paid`
- requiredSkills
- estimatedMinutes
- assignedWorkerId
- qaReviewer
- qualityScore
- payoutAmount
- dueAt
- createdAt
- notes

## Gig Worker

Represents a synthetic worker profile that can receive tasks.

- id
- name
- role
- region
- timezone
- skills
- languages
- qualityScore
- availability: `available`, `busy`, `offline`
- workload
- maxWorkload
- hourlyRate
- bio

## QA Review

Tracks the latest QA state for a task.

- id
- taskId
- jobId
- reviewer
- outcome: `approved`, `correction-needed`, `escalated`
- reason
- updatedAt

## Payout Record

Tracks worker payout status for approved work.

- id
- taskId
- workerId
- amount
- status: `queued`, `processing`, `paid`
- scheduledFor
- updatedAt

## Audit Event

Tracks system, client, reviewer, and orchestration actions.

- id
- timestamp
- eventType: `job.created`, `job.reviewed`, `task.assigned`, `task.reassigned`, `qa.approved`, `qa.correction_needed`, `qa.escalated`, `payout.queued`, `payout.paid`
- actor
- entityType: `job`, `task`, `worker`, `review`, `payout`
- entityId
- summary
- details

## Notes For Future Backend Work

- Firestore can store job batches, tasks, worker profiles, and reviews as separate collections.
- Pub/Sub can carry orchestration events between dispatch, QA, payout, and audit workers.
- Cloud Storage can hold task attachments and exports.
- Auth0 can be added without changing these entity shapes.
