# GigOps Lite GCP Architecture

This prototype is designed to evolve into a GCP-hosted gig orchestration platform without changing the core product model.

## Proposed Services

- Cloud Run for the Node.js TypeScript API.
- Firestore for jobs, tasks, workers, QA states, payout records, and audit metadata.
- Pub/Sub for orchestration events such as assignment, review completion, and payout batching.
- Cloud Storage for attachments, exports, and batch artifacts.
- Cloud Logging for structured operational and audit logs.
- Auth0 for user identity and organization access.

## Flow Overview

1. A client creates a job batch.
2. The orchestrator expands the batch into tasks.
3. Assignment logic ranks workers using skills, availability, workload, and quality.
4. QA reviewers approve, correct, or escalate tasks.
5. Approved tasks enter payout simulation or real payout processing later.
6. Every state change emits an audit event.

## Future Deployment Shape

- Frontend: Next.js app on Cloud Run or a static host with API access.
- API: Node.js TypeScript services on Cloud Run.
- Data: Firestore collections keyed by job, task, worker, review, payout, and audit.
- Events: Pub/Sub topics per orchestration stage.
- Observability: logs, traces, and SLO alerts in Cloud Logging and Cloud Monitoring.
