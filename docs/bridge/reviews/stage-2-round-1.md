VERDICT: PASS

CRITERIA:
- Postgres `sync_ledger` table with unique idempotency key, source/target ids, status, payload hash, attempts, timestamps, last error -> met. `api/migrations/0001_create_sync_ledger.sql:11-27` has all these columns, a `UNIQUE` constraint on `idempotency_key`, and a `CHECK` on `status`.
- Migrations follow expand/contract rules -> met. `api/src/bridge/ledger/migrate.ts` is additive-only by design (comment at lines 5-9), tracks applied files in `schema_migrations`, and serialises concurrent runs with a Postgres advisory lock (lines 17-24, 30, 60). Tested for safe re-run, applying a new file, and rollback-on-failure in `api/test/bridge/ledger/migrate.test.ts:21-85`.
- A repository layer -> met. `api/src/bridge/ledger/repository.ts` (`SyncLedgerRepository`: `recordSync`, `getByIdempotencyKey`, `updateStatus`).
- Integration tests run against a real Postgres (committed `api/docker-compose.bridge-db.yml`, port 5433) -> met. Confirmed the container `gigops-bridge-postgres` was already running (`docker ps`), and `npm test` genuinely connects via `BRIDGE_DATABASE_URL` from `api/.env` (loaded by `api/test/bridge/ledger/env-setup.ts`) -- no mocks.
- Same key + same payload -> one record, same result -> met, test: `repository.test.ts:61-75` ("returns the same row for the same key and the same payload").
- Same key + different payload -> conflict -> met, test: `repository.test.ts:77-100` ("reports a conflict... and writes nothing new").
- Concurrent duplicate inserts handled safely -> met, test: `repository.test.ts:102-119` (10 parallel `recordSync` calls with the same key -> exactly 1 "created", 9 "duplicate", 1 row in the DB), relying on the atomic `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING` (`repository.ts:68-74`).

TESTS run (all on the base of HEAD at `0f4baf6`, with the real bridge Postgres container up):
- `cd api && npm run typecheck` -> pass
- `cd api && npm run lint` -> pass (clean)
- `cd api && npm test` (Vitest) -> 117/117 passed, 10 test files
- `cd api && npx vitest run --coverage` -> 94.87% stmt / 93.15% branch overall; ledger module 98.7%/95.23%
- `cd api && npm run build` -> pass; deleted `api/dist` afterward
- `npm audit --omit=dev` on HEAD and on a temporary worktree at base `1d2e46b987fe5ad8d2d64d1aa6651b14661fe30f` -> identical 4 vulnerabilities (body-parser, proxy-addr, qs, zod) in both; confirmed pre-existing, not introduced by `pg`
- Base-commit full check (typecheck/lint/test) in the temporary worktree -> 94/94 tests passed, confirming the baseline was clean and the +23 new tests are all additions from this stage
- Frontend/README unaffected by this diff (`git diff --stat ... -- frontend README.md` empty), so frontend commands were not required per WORKFLOW.md's conditional rule, and were not run

FINDINGS:
1. MINOR -- `api/src/bridge/ledger/hash.ts:8-18` (`canonicalize`). A `Date` instance is `typeof "object"`, so it falls into the generic object-recursion branch; `Object.keys()` on a `Date` returns no enumerable own properties, so it canonicalizes to `{}`. Verified directly: `hashPayload({ when: new Date('2020-01-01') })` and `hashPayload({ when: new Date('2021-06-15') })` produce the identical hash. This would silently defeat the "same key + different payload -> conflict" guarantee if a `Date` object ever reached this function. Currently not reachable in practice -- Stage 1's domain model stores all dates as ISO strings (`api/src/bridge/domain/deal.ts:40`), never `Date` instances -- but `hashPayload` is a general-purpose `unknown`-typed function likely to be reused by later stages. Suggested fix: special-case `Date` (e.g. `value.toISOString()`) before the generic object branch, or throw for unsupported types.
2. MINOR -- `api/src/bridge/ledger/repository.ts:84` (the "conflicted on insert but no row was found" defensive throw) is unreached by any test (confirmed via coverage report: only this line uncovered in `repository.ts`). It's a near-impossible race under Postgres's actual guarantees, so not blocking, but worth a note if a future review wants 100% line coverage on this file.
3. MINOR / informational -- `api/src/bridge/ledger/repository.ts:109-127` (`updateStatus`): `last_error` is unconditionally overwritten to `null` unless the caller passes a new value in the same call (`details.lastError ?? null`), so any status transition silently clears a previously recorded error. Not exercised incorrectly by any current caller (Stage 4, the real caller, doesn't exist yet), but worth keeping in mind once retry logic is built on top of it.
4. MINOR / informational -- `docs/bridge/NEEDS_YOU.md:51` itself flags that the Stage 1 round-2 MAJOR fix (`6ba5120`) was never confirmed by the round-3 blind review WORKFLOW.md's loop calls for. This is a carried-over process gap from Stage 1, not something Stage 2 introduced or needed to fix, but it should be closed before treating the bridge as fully reviewed end-to-end.

None of the above rise to BLOCKER or MAJOR. Scope stayed exactly within Stage 2 (`api/src/bridge/ledger/**`, `api/migrations/**`, tests, `.env.example`, the `pg`/`@types/pg` dependency addition correctly logged in `AGENTS.md` per the WORKFLOW.md rule that SPEC.md counts as Prateek's explicit approval for what the stage needs) -- no HTTP layer, worker, or other later-stage code leaked in. No secrets committed; `.env` stays git-ignored and only placeholders are in `api/.env.example`.

Relevant files: `api/migrations/0001_create_sync_ledger.sql`, `api/src/bridge/ledger/{types,settings,hash,db,migrate,repository}.ts`, `api/test/bridge/ledger/{db,hash,migrate,repository,settings}.test.ts`, `api/test/bridge/ledger/env-setup.ts`, `api/docker-compose.bridge-db.yml`, `api/.env.example`, `docs/bridge/NEEDS_YOU.md`, `AGENTS.md`.
