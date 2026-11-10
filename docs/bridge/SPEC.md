# Quote-to-Cash Bridge: Spec
Goal: Salesforce Closed Won deals become ERPNext invoices; payment status flows back; mismatches are reconciled. Salesforce- and ERPNext-specific types live only inside adapter modules (the anti-corruption layer); the rest of the code uses our own Deal, Customer and Invoice types.
Each stage lists BUILD and DONE WHEN. A stage is DONE only when every DONE WHEN item is met, tested, and passes blind review.

Personal portfolio project. Never describe it as professional or employment experience.

## Where things live in this repo (added during setup)
This repo has two npm packages and no root package.json: `api/` (Express 5 + TypeScript + Zod) and `frontend/` (Next.js). The bridge is backend work, so it lives in `api/`:
- `api/src/bridge/domain/`: our own Deal, Customer and Invoice types and Zod schemas (no vendor types)
- `api/src/bridge/adapters/salesforce/` and `api/src/bridge/adapters/erpnext/`: the adapter folders. These are the ONLY places Salesforce or ERPNext types may be imported.
- `api/src/bridge/ledger/`, `api/src/bridge/http/`, `api/src/bridge/worker/`, `api/src/bridge/reconcile/`: stages 2, 3, 4 and 7
- `api/migrations/`: SQL migrations (stage 2)
- `api/test/bridge/`: unit, integration and contract tests
- `salesforce/`: the Salesforce DX project (stage 5)
- `docs/bridge/`: spec, workflow, progress, reviews, runbook and lessons
Commands for typecheck, lint and tests are listed in docs/bridge/WORKFLOW.md under COMMANDS.

Stage 1: Domain model and anti-corruption layer
BUILD: Zod schemas and types for Deal, Customer, Invoice; mappers Salesforce Opportunity/Account -> Deal and Deal -> ERPNext Customer/Sales Invoice payloads; docs/bridge/MAPPING.md (start from docs/bridge/MAPPING_DRAFT.md if it exists; otherwise draft it and log it under "Review when you can").
DONE WHEN: unit tests cover every mapped field, money as integer minor units or a decimal library (never floats), currency, missing optional fields, and invalid input rejected with clear errors; no Salesforce or ERPNext types imported outside the adapter folders.

Stage 2: Sync ledger and idempotency
BUILD: Postgres sync_ledger table (unique idempotency key, source and target ids, status, payload hash, attempts, timestamps, last error); migrations that follow expand/contract rules; a repository layer.
DONE WHEN: integration tests run against a real Postgres -- on Prateek's machine, the committed `api/docker-compose.bridge-db.yml` (postgres:16, host port 5433; see docs/bridge/WORKFLOW.md COMMANDS); same key + same payload -> one record and the same result; same key + different payload -> conflict; concurrent duplicate inserts handled safely.

Stage 3: Inbound API
BUILD: POST /bridge/v1/deals and GET /bridge/v1/deals/:id/status. API-key auth (keys stored hashed, never in plain text), required Idempotency-Key header, Zod validation, per-key rate limiting, 202 Accepted for new work. OpenAPI spec for these endpoints. A correlation id and an OpenTelemetry span per request.
DONE WHEN: tests for 401, 400, 409 (idempotency conflict), 429 and the 202 happy path; the OpenAPI file validates.

Stage 4: ERPNext writer
BUILD: a worker that processes pending ledger entries: find-or-create Customer, create Sales Invoice as Draft, store ERPNext ids in the ledger. Submit automatically only when `BRIDGE_AUTO_SUBMIT` is true and every check passed (products matched, totals equal, tax applied, customer clean); otherwise leave it as Draft and flag it (MAPPING.md Decision 5). Retries with exponential backoff and jitter; a circuit breaker around ERPNext calls; optimistic concurrency using ERPNext's modified timestamp on updates.
DONE WHEN: contract tests against a fake ERPNext cover success, timeout, 5xx, timestamp conflict, breaker open/half-open/closed, and both the draft-only and auto-submit paths; one documented manual run against the dev ERPNext.

Stage 5: Salesforce outbound (Apex)
BUILD: a Salesforce DX project in salesforce/: Account field ERP_Customer_Id__c; Opportunity fields ERP_Invoice_Id__c, Invoice_Status__c, Invoice_Total__c, Balance_Due__c, Invoice_Due_Date__c, Sync_Status__c, Sync_Error__c, Last_Sync_At__c (full field list and types: MAPPING.md Decision 6); a trigger + handler class for Closed Won; Queueable Apex that calls POST /bridge/v1/deals through a Named Credential + External Credential with a stable Idempotency-Key; Apex tests with HttpCalloutMock. The adapter must be reachable from Salesforce (a free tunnel or a free-tier deployment; ask me to choose).
DONE WHEN: Apex tests pass in my Developer Edition org with at least 75% coverage (aim for 90%); closing a test Opportunity creates an ERPNext invoice end to end, recorded in docs/bridge/DEMO.md.

Stage 6: Return path and LWC
BUILD: POST /bridge/v1/erpnext/events for ERPNext webhooks (verify a shared secret or signature); update the Salesforce Opportunity through the REST API using an External Client App and the OAuth 2.0 JWT bearer flow (never username-password), writing Invoice_Status__c (translated from the ERPNext status per MAPPING.md Decision 6, falling back to "Unknown" plus an alert for any unrecognised value), Invoice_Total__c, Balance_Due__c, Invoice_Due_Date__c, Sync_Status__c and Last_Sync_At__c; reject stale updates by checking LastModifiedDate; a Lightning Web Component on the Opportunity page showing ERP invoice and payment status.
DONE WHEN: tests for signature check, duplicate webhook, stale update, token caching and refresh, and the status translation (including an unrecognised value); LWC Jest tests; a payment in ERPNext updates Salesforce end to end.

Stage 7: Reconciliation and feature flag
BUILD: a job comparing Salesforce Closed Won deals, ERPNext invoices and the ledger: missing, duplicate, pre-tax amount mismatch (Salesforce pre-tax total vs. ERPNext net total, per MAPPING.md Decision 2 -- never the tax-inclusive grand total), currency mismatch. The same nightly run also refreshes every open invoice's Salesforce status fields, since time-based changes such as Overdue may not send a webhook event (MAPPING.md Decision 6, Timing). Output as CSV and a JSON endpoint. Feature flag TWO_WAY_SYNC_ENABLED, default off.
DONE WHEN: tests with seeded mismatches; every mismatch explained in plain English in the report; a test confirms the nightly run updates Salesforce status for an invoice whose status changed without a webhook event.

Stage 8: Observability and incident readiness
BUILD: OpenTelemetry traces across inbound request -> worker -> ERPNext/Salesforce calls; structured JSON logs with correlation id and no secrets or personal data; metrics (sync success/failure, breaker state, oldest pending item); docs/bridge/RUNBOOK.md (what each alert means, how to replay a failed sync, how to rotate keys).
DONE WHEN: one trace of a full deal journey is captured in the docs; the runbook covers every failure mode found in stages 4-6.

Stage 9: Documentation and demo
BUILD: a README section with a mermaid architecture diagram, setup steps, OpenAPI link, a 5-minute demo script, and docs/bridge/PORTFOLIO.md with honest resume bullets labelled as a personal project. Open a pull request to the default branch.
DONE WHEN: setup steps verified from a fresh clone; PR open with a summary (do not merge).
