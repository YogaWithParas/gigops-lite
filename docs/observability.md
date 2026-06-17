# GigOps Lite Observability

The prototype includes a visible audit log, but the future platform should use full telemetry.

## Signals

- Structured logs for orchestration actions.
- Metrics for assignment latency, QA turnaround, payout lag, and queue depth.
- Traces for job creation through task completion.

## Logging Guidance

- Log one structured event per state transition.
- Include `jobId`, `taskId`, `workerId`, `reviewId`, or `payoutId` when available.
- Avoid logging secrets or worker PII beyond what is needed for the prototype.

## Monitoring Guidance

- Alert on stalled task queues.
- Alert when QA backlog grows faster than approvals.
- Alert when payout delay exceeds the SLO target.
