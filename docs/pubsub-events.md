# GigOps Lite Pub/Sub Events

Events are part of the future backend plan. The current UI only simulates them.

## Event Types

- `job.created`
- `job.reviewed`
- `task.assigned`
- `task.reassigned`
- `qa.approved`
- `qa.correction_needed`
- `qa.escalated`
- `payout.queued`
- `payout.paid`

## Event Payload Shape

```json
{
  "eventType": "task.assigned",
  "entityType": "task",
  "entityId": "TASK-2002",
  "actor": "orchestrator",
  "timestamp": "2026-06-16T10:10:00Z",
  "summary": "Assigned task to Jordan Kim",
  "details": "Assignment balanced skill fit, availability, and queue priority."
}
```

## Delivery Notes

- Use idempotent handlers.
- Preserve event ordering per entity where possible.
- Persist a compact audit copy even if downstream consumers fail.
