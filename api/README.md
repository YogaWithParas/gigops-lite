# GigOps Lite API (v0.2 Prototype)

This folder contains a standalone Node.js + TypeScript backend API service for GigOps Lite.

## Scope

Implemented in this API service:
- Express + TypeScript service
- In-memory synthetic data
- requestId in every response
- Structured error envelope
- Pagination metadata for list endpoints
- Idempotency simulation for POST /jobs using Idempotency-Key

Not implemented yet:
- Firestore or any database persistence
- GCP integrations
- Auth0
- Pub/Sub
- Docker or CI/CD

## Endpoints

- GET /health
- GET /jobs?page=1&limit=10
- POST /jobs
- GET /tasks?page=1&limit=10
- POST /tasks/:id/assign
- GET /agents
- GET /audit

## Run Locally

```bash
cd api
npm install
npm run dev
```

Default URL:

```text
http://localhost:4000
```

## Type Check and Build

```bash
cd api
npm run typecheck
npm run build
```

## Response Envelope

Success:

```json
{
  "requestId": "...",
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "requestId": "...",
  "error": {
    "code": "...",
    "message": "...",
    "details": {}
  }
}
```

## Curl Examples

Health:

```bash
curl -i http://localhost:4000/health
```

Jobs list:

```bash
curl -i "http://localhost:4000/jobs?page=1&limit=10"
```

Create job (first request returns 201):

```bash
curl -i -X POST http://localhost:4000/jobs \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: job-create-001" \
  -d '{"clientName":"Northwind Care","title":"CX Triage Batch","type":"cx","priority":"high","taskCount":24}'
```

Create job replay with same key and same payload (returns 200 and meta.idempotentReplay=true):

```bash
curl -i -X POST http://localhost:4000/jobs \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: job-create-001" \
  -d '{"clientName":"Northwind Care","title":"CX Triage Batch","type":"cx","priority":"high","taskCount":24}'
```

Tasks list:

```bash
curl -i "http://localhost:4000/tasks?page=1&limit=10"
```

Assign task:

```bash
curl -i -X POST http://localhost:4000/tasks/TASK-2002/assign \
  -H "Content-Type: application/json" \
  -d '{"agentId":"AG-002"}'
```

Agents list:

```bash
curl -i http://localhost:4000/agents
```

Audit list:

```bash
curl -i http://localhost:4000/audit
```
