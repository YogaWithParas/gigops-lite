VERDICT: PASS

CRITERIA (Stage 1 DONE WHEN, docs/bridge/SPEC.md):
- Unit tests cover every mapped field -> met. `api/test/bridge/domain/deal.test.ts`, plus existing `salesforce-mapper.test.ts`/`erpnext-mapper.test.ts` (unchanged by this commit, still passing).
- Money as integer minor units/decimal, never floats -> met. `api/src/bridge/domain/money.ts:18-29` (`centsFromDecimal`) now does BigInt arithmetic and rejects anything above `Number.MAX_SAFE_INTEGER` instead of silently losing precision (round-2 MINOR finding); `calculateLineTotalCents` (unchanged, already BigInt-based) is now also enforced inside `dealLineSchema` itself (`api/src/bridge/domain/deal.ts:27-32`). New boundary test: `api/test/bridge/domain/money.test.ts:98-102`.
- Currency -> met. Domain-level `dealSchema`/`invoiceSchema` now require literal `"CAD"` (`api/src/bridge/domain/deal.ts:41,60`) and `validateTotals` (`deal.ts:90-100`) rejects any line/total whose currency doesn't match the document currency -- closing the round-2 MAJOR gap where contradictory currencies were previously accepted.
- Missing optional fields -> met (unchanged from prior stage-1 work; not touched by this commit).
- Invalid input rejected with clear errors -> met. `billingAddressSchema` (`deal.ts:9-15`) now reuses `normaliseProvince`/`normalisePostalCode`/`normaliseIsoDate` and requires the stored value to already be canonical, so `"ZZ"` provinces, malformed postal codes, non-Canada countries and impossible calendar dates (`2026-02-30`) are all rejected at the domain boundary, not just inside the Salesforce mapper. Verified with `npm test` (93/93 passing, including the new `it.each` cases at `deal.test.ts:82-106`) and independently re-ran `dealSchema`/`customerSchema`/`invoiceSchema` by hand via the test suite.
- No Salesforce/ERPNext types imported outside adapter folders -> met. Confirmed via `grep` for vendor type names under `api/src/bridge/domain` (no matches) and a clean `npm run lint` (the anti-corruption ESLint rule did not fire).

Independent checks run (from `C:/dev/gigops-prototype-stage1-round2-fix-review`):
- `cd api && npm run typecheck` -> PASS
- `cd api && npm run lint` -> PASS
- `cd api && npm test` -> PASS, 5 files / 93 tests
- `cd api && npm run build` -> PASS (deleted generated `api/dist` afterward)
- `cd api && npm run dev` + `npm run smoke:test` -> PASS, 7 check groups
- `cd frontend && npm run typecheck` -> PASS
- `cd frontend && npm run scan:legacy` -> PASS
- `cd frontend && npm run verify` -> PASS (build succeeded, Google Fonts reachable on this machine)
- `cd frontend && npx next dev -p 3000` + `npm run test:routes` -> PASS, 8 UI routes / 4 API routes
- `git status --porcelain` after all runs -> clean (no stray build artifacts, no untracked changes)

FINDINGS:
1. MINOR -- `docs/bridge/MAPPING.md` (bottom, "Stage 1 verification follow-up" section). This section still only lists the round-1 fixes (AccountId consistency, exact decimal line totals) and was not extended to mention the round-2 fixes made in this commit (domain-level address/date/currency/total invariants, safe-integer boundary in `centsFromDecimal`). The underlying rules were already documented elsewhere (Decision 1/2, "Data normalisation"), so this is a traceability gap rather than a missing rule. Suggested fix: add one line noting these invariants are now also enforced at the `Deal`/`Customer`/`Invoice` schema level, not only in the Salesforce mapper.
2. MINOR -- `docs/bridge/reviews/stage-1-verification-round-1.md`. This already-saved review record was edited in this commit (arrow characters and code-formatting changed) with no change to substantive content (verified via diff: same findings, same verdict, same test results, just re-formatted). Editing a past, already-delivered review transcript is unusual even when purely cosmetic; worth avoiding in future since it could obscure a real edit if one were ever made. Not a functional issue here.

No BLOCKER or MAJOR findings. Both findings from the round-2 blind review (MAJOR: domain-level invariants not enforced; MINOR: `centsFromDecimal` precision loss on oversized input) are fixed, covered by new regression tests, and the fixes do not weaken any existing test. Full typecheck/lint/test/build/smoke suite (API and frontend) passes.

SCOPE NOTE: reviewed range is `0a08d23..6ba5120` (commit `6ba5120` alone, "Enforce financial and address invariants at domain boundaries"), reviewed in an isolated worktree so all later commits were out of scope. This closes the outstanding round-3 confirmation that WORKFLOW.md's loop calls for after any MAJOR fix (see PROGRESS.md / NEEDS_YOU.md -- this fix was applied during the Stage 1 verification continuation but never previously sent to blind review).
