# GigOps Lite SLOs

These targets are planning values for the future service, not enforced today.

## Proposed Targets

- Task assignment latency: 95 percent under 60 seconds.
- QA turnaround: 95 percent under 15 minutes.
- Payout queue delay: 95 percent under 1 hour.
- Audit event availability: 99.9 percent of transitions logged.

## Error Budget Ideas

- Track missed assignment windows separately from QA backlog.
- Treat payout delays as the most visible customer-impacting risk.
- Preserve audit coverage even during partial failures.
