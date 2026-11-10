# Progress
Status: IN PROGRESS
(Allowed values: IN PROGRESS | SETUP COMPLETE | BLOCKED: waiting on human | ALL STAGES DONE)
Current stage: 1 (domain model and anti-corruption layer)

| Stage | Status | Base SHA | Review rounds | Summary |
|---|---|---|---|---|
| 0 (setup) | DONE | 5c78bf3 | n/a (setup only) | Harness created: spec, workflow, progress, needs-you, learning log, blind-reviewer and tutor agents, stop-gate hook, settings, ignore rules. Existing checks at base: api typecheck/build/smoke PASS; frontend typecheck and route smoke PASS; frontend scan:legacy FAIL (pre-existing); frontend build FAIL in cloud only (Google Fonts blocked). Push refused (GitHub access), see NEEDS_YOU.md. |
| 0 (setup, Windows laptop) | DONE | 5cede14 | n/a (setup only) | Finished setup on Prateek's Windows laptop: rewrote the stop gate as Windows-reliable Node.js and scoped it to a .claude/bridge-run.on marker; started the local bridge Postgres (docker-compose, port 5433) and proved a real connection; confirmed the local ERPNext instance (frappe_docker) is reachable; logged the Stage 4 ERPNext integration-user ask in NEEDS_YOU.md; re-ran every stop-gate scenario and the full WORKFLOW.md command checklist, all PASS; pushed feature/sf-bridge to origin. |
| 1 (domain + anti-corruption layer) | IN PROGRESS | c5bb8d0 | 0 so far | See plan below. |

## Stage 1 plan (base c5bb8d0)
Files to touch:
- `api/package.json`, `api/package-lock.json`: add Vitest + ESLint (+ typescript-eslint) as devDependencies, per the approved exception in AGENTS.md; add `npm test` / `npm run lint` scripts.
- `api/src/bridge/domain/money.ts`, `normalise.ts`, `deal.ts`, `result.ts`: Money (integer cents + ISO 4217 currency), the normalisation functions from MAPPING_DRAFT.md's table, and the Deal/Customer/Invoice Zod schemas/types.
- `api/src/bridge/adapters/salesforce/{types,mapper}.ts`: raw Opportunity/Account/OpportunityLineItem shapes (vendor-shaped, confined here) and `mapOpportunityToDeal`.
- `api/src/bridge/adapters/erpnext/{types,mapper}.ts`: ERPNext Customer/Sales Invoice payload shapes (confined here) and `mapDealToErpCustomerPayload` / `mapDealToErpInvoicePayload`.
- `api/test/bridge/**`: unit tests for every item above, including the "report every problem at once" validation behaviour.
- `docs/bridge/MAPPING.md`: promoted from MAPPING_DRAFT.md; Stage 1 rules documented as built, later-stage rules (tax, customer find-or-create, draft/submit, reconciliation) documented as not-yet-built.
- `eslint.config.js` (or similar) in `api/`: a `no-restricted-imports`-style rule so Salesforce/ERPNext vendor-shaped types can only be imported from inside their own adapter folder.

Tests first within each small step; commit after each green step. Scope is exactly SPEC.md Stage 1's DONE WHEN -- no tax, no customer matching/find-or-create, no draft/submit, no persistence. Those stay documented only.
