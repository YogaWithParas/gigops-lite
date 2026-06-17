# GigOps Lite API Contracts

All API routes are mock implementations today. They return synthetic data from the frontend codebase and are intended to mirror future Node.js TypeScript services behind Cloud Run.

## `GET /api/jobs`

Returns the current mock job batches.

```json
{
  "jobs": []
}
```

## `POST /api/jobs`

Accepts a synthetic job draft and returns an acknowledgement.

Request fields:

- clientName
- title
- type
- priority
- status
- taskCount
- notes
- requiredSkills

Response fields:

- ok
- message
- submitted
- nextStatus

## `GET /api/tasks`

Returns the current mock task queue.

## `POST /api/tasks`

Accepts a taskId and returns a synthetic assignment decision based on the mock scoring helper.

Request fields:

- taskId

Response fields:

- ok
- taskId
- assignedWorkerId
- score
- rationale

## `GET /api/agents`

Returns the mock worker roster.

## `GET /api/audit`

Returns the synthetic audit log.

## Contract Rules

- Responses are synthetic and non-persistent.
- IDs are stable in the prototype but should be treated as server-generated later.
- The future backend should preserve the same field names to minimize UI churn.
