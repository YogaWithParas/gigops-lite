VERDICT: CHANGES REQUIRED

CRITERIA:
- Deal, Customer and Invoice Zod schemas and types → met, `api/src/bridge/domain/deal.ts:9–59`.
- Salesforce Opportunity/Account → Deal and Deal → ERPNext payload mappings → implemented, but correctness incomplete; Findings 1–2.
- MAPPING.md → met, `docs/bridge/MAPPING.md` documents mappings and later-stage responsibilities.
- Every mapped field, currency and missing optional fields covered by unit tests → existing field/default tests pass; monetary rounding and mismatched-account cases are missing.
- Money uses integer minor units or decimal arithmetic, never floats → not met: `api/src/bridge/adapters/salesforce/mapper.ts:151` calculates discounted amounts using binary floating-point arithmetic.
- Invalid input rejected with clear errors → not fully met: mismatched Account input is accepted.
- No vendor types imported outside adapter folders → met for production source. Tests directly import Salesforce fixture types.

FINDINGS:
1. MAJOR — `api/src/bridge/adapters/salesforce/mapper.ts:151`. Discounted totals use `Math.round(quantity * unitPriceCents * (1 - discountPercent / 100))`. Confirmed reproduction: quantity 1, UnitPrice 0.05, Discount 90, Salesforce TotalPrice 0.01 produces `"Line total for product X (0 cents) does not match Salesforce TotalPrice (1 cents)"`. Binary floating-point arithmetic makes the mathematical half-cent slightly less than 0.5, rejecting a valid deal. Use exact decimal or scaled-integer/rational arithmetic with an explicit rounding rule; add half-cent, fractional-quantity and fractional-discount tests.

2. MAJOR — `api/src/bridge/adapters/salesforce/mapper.ts:26–28,185`. The mapper checks that Opportunity.AccountId exists but never verifies it equals the supplied Account.Id. Confirmed that Opportunity.AccountId `001000000000002AAA` with Account.Id `001000000000001AAA` returns success, assigning the latter account and its billing address to the deal. This permits invoicing the wrong customer. Reject mismatches with a clear error and add a regression test.

TESTS:
- API `npm run typecheck` — PASS.
- API `npm run lint` — PASS.
- API `npm test` — PASS: 5 files, 67 tests.
- API `npm run build` — PASS.
- API `npm run smoke:test` — PASS: 7 checks.
- Frontend `npm run typecheck` — PASS.
- Frontend `npm run scan:legacy` — PASS.
- Frontend `npm run verify` — PASS.
- Frontend `npm run test:routes` — PASS: 8 UI routes and 4 API routes.
- Ad hoc mismatch reproduction — defect confirmed.
- Ad hoc half-cent rounding reproduction — defect confirmed.
- Additional frontend dev-server launch could not start because port 3000 was already occupied; route checks passed against the existing server.
- No source files edited by reviewer. Build outputs need cleanup: `api/dist` and generated `frontend/next-env.d.ts` change. Parent notified.
