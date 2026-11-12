VERDICT: PASS

CRITERIA (Stage 1 DONE WHEN, docs/bridge/SPEC.md, assessed against the full current state of the branch, with this review's scope being the two commits since base 6ba5120):
- Zod schemas/types for Deal, Customer, Invoice -> met, unchanged by this diff. `api/src/bridge/domain/deal.ts:9-64`.
- Salesforce Opportunity/Account -> Deal and Deal -> ERPNext mappers -> met, unchanged by this diff.
- Unit tests cover every mapped field, money as integer minor units/decimal (never floats), currency, missing optional fields, invalid input rejected with clear errors -> met, and this diff specifically strengthens the "never floats" guarantee: `api/src/bridge/domain/money.ts:64-75` (`decimalFromCents`) now detects the one remaining way a cents-to-decimal conversion could silently lose a cent (amounts near `Number.MAX_SAFE_INTEGER`) and throws instead of returning a silently-rounded value, verified by `api/test/bridge/domain/money.test.ts:60-66` (`decimalFromCents(Number.MAX_SAFE_INTEGER)` throws `/cannot be represented exactly/`).
- No Salesforce/ERPNext types imported outside adapter folders -> met, unaffected by this diff; re-confirmed via grep (only the four adapter files match `RawSalesforce|ErpCustomerPayload|ErpSalesInvoice`).
- MAPPING.md written -> met, unaffected by this diff.

Both commits address real, previously-latent defects rather than cosmetic churn: `23c2c71` closes the mirror-image of the already-fixed `centsFromDecimal` precision bug (the `decimalFromCents` direction, used in `api/src/bridge/adapters/erpnext/mapper.ts:43`), and `72e2562` fixes a test fixture in `api/test/bridge/adapters/erpnext-mapper.test.ts` that had an internally-inconsistent `amount` vs. sum-of-line-totals (125000 vs. 112500 cents) which went undetected because the fixture was only type-asserted as `Deal`, never actually parsed through `dealSchema`. Routing it through `dealSchema.parse(...)` now means that specific invariant is exercised on every test run.

FINDINGS:
1. MINOR -- `api/src/bridge/domain/money.ts:64-75`. `decimalFromCents` now throws a raw `Error` on the precision-loss edge case, while every other fallible function in this file (`centsFromDecimal`) returns the `Result<T>` pattern (`ok`/`err`). The one call site (`api/src/bridge/adapters/erpnext/mapper.ts:43`, inside a `.map()`) has no try/catch, so this is fine today only because nothing downstream calls this mapper yet (Stage 4 is unbuilt). Worth a one-line note in NEEDS_YOU.md or MAPPING.md so Stage 4's worker is written with this in mind (catch-and-flag rather than letting it crash the worker), but it does not block Stage 1, since the edge case (~$90 trillion line price) is unreachable by any realistic business input and is clearly documented and tested.
2. MINOR (informational) -- `docs/bridge/PROGRESS.md` and `docs/bridge/NEEDS_YOU.md` have not yet been updated to mention these two follow-up commits or the resulting 94-test count (last entry says "Now 93 tests pass" after verification round 2). Per WORKFLOW.md step 9 this update normally happens when the stage is marked DONE after a passing review, so this is expected to still be pending, not a defect -- flagging only so it isn't forgotten.

TESTS:
- `cd api && npm ci` -> pass (222 packages, no lock changes)
- `cd api && npm run typecheck` -> pass, no errors
- `cd api && npm run lint` -> pass, no errors
- `cd api && npm test` (vitest) -> pass, 5 files / 94 tests
- `cd api && npx vitest run --coverage` -> pass, 94/94; 93.61% stmt / 92.65% branch overall (uncovered lines confined to the pre-existing, previously-reviewed defensive branches in `adapters/salesforce/mapper.ts`)
- `cd api && npm run build` -> pass; `dist/` deleted afterward (confirmed clean)
- `cd api && npm run dev` + `npm run smoke:test` -> pass, 7/7 checks; dev server process stopped afterward
- `cd frontend && npm ci` -> pass (350 packages)
- `cd frontend && npm run typecheck` -> pass
- `cd frontend && npm run scan:legacy` -> pass
- (Frontend `verify`/route-smoke skipped: this diff touches only `api/src/bridge/domain/money.ts` and two `api/test` files, confirmed by `git diff 6ba5120..HEAD --stat`; frontend typecheck/scan:legacy above confirm no collateral impact.)
- No KNOWN BASELINE ISSUES encountered; no base-commit worktree comparison needed since everything passed outright.

Files reviewed (absolute paths under `C:\dev\gigops-prototype-stage1-followup-review`, a worktree pinned to the commit under review):
- `api\src\bridge\domain\money.ts`, `deal.ts`
- `api\src\bridge\adapters\erpnext\mapper.ts`
- `api\test\bridge\domain\money.test.ts`, `deal.test.ts`
- `api\test\bridge\adapters\erpnext-mapper.test.ts`
- `docs\bridge\SPEC.md`, `docs\bridge\WORKFLOW.md`, `docs\bridge\PROGRESS.md`, `docs\bridge\NEEDS_YOU.md`
- `docs\bridge\reviews\stage-1-round-1.md`, `stage-1-round-2.md`, `stage-1-verification-round-1.md`, `stage-1-verification-round-2.md`

SCOPE NOTE: reviewed range is `6ba5120..72e2562` (commits `23c2c71`, `72e2562` only) -- the two previously-open Stage 1 follow-up items (decimal-serialization cent loss; the ERPNext fixture's inconsistent totals), reviewed in an isolated worktree so later Stage 2 commits were out of scope.
