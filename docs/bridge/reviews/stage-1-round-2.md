VERDICT: PASS

CRITERIA (Stage 1 DONE WHEN, docs/bridge/SPEC.md):
- Zod schemas and types for Deal, Customer, Invoice -> met. `api/src/bridge/domain/deal.ts:9-59` (billingAddressSchema, dealLineSchema, dealSchema, customerSchema, invoiceSchema); tested in `api/test/bridge/domain/deal.test.ts`.
- Mapper Salesforce Opportunity/Account -> Deal -> met. `api/src/bridge/adapters/salesforce/mapper.ts` (`mapOpportunityToDeal`); 16 tests in `api/test/bridge/adapters/salesforce-mapper.test.ts`, including the four branches (zero/negative quantity, discount out of range, missing description+no fallback, missing TotalPrice) that round-1 review flagged as untested -- now covered (lines 152-207 of that test file).
- Mapper Deal -> ERPNext Customer/Sales Invoice payloads -> met. `api/src/bridge/adapters/erpnext/mapper.ts`; tested in `api/test/bridge/adapters/erpnext-mapper.test.ts`, including the round-1-added "falls back to raw country code" case.
- docs/bridge/MAPPING.md written (from MAPPING_DRAFT.md) -> met. `docs/bridge/MAPPING.md` exists with a Stage-1-built-vs-documented-only table; `docs/bridge/MAPPING_DRAFT.md` now marked superseded.
- Unit tests cover every mapped field, money as integer minor units (never floats), currency, missing optional fields, invalid input rejected with clear errors -> met. `npx vitest run --coverage` shows `adapters/salesforce/mapper.ts` branch coverage improved from 80.2% (round 1) to 87.5%/90.97% overall; remaining uncovered branches (an unreachable-in-practice decimal-parse failure on `TotalPrice` at mapper.ts:154-155, and the final Zod safety-net at mapper.ts:204) are defensive code paths, not named mapped fields, so this does not block the criterion.
- No Salesforce or ERPNext types imported outside the adapter folders -> met and now properly enforced. `grep` confirms vendor types appear only in the four adapter files (plus the matching test file that exercises the mapper). Verified live with scratch files: an import of `erpnext/types` from inside `adapters/salesforce/` is now blocked (round-1 fix to `eslint.config.mjs`'s `no-restricted-imports` scoping), and an import of `salesforce/types` from outside any adapter folder is also blocked.

TESTS (run directly, not from commit claims):
- `cd api && npm ci` -> pass (222 packages, no lock changes)
- `cd api && npm run typecheck` -> pass
- `cd api && npm run lint` -> pass
- `cd api && npm test` (vitest) -> pass, 5 files / 67 tests
- `cd api && npx vitest run --coverage` -> pass, 67/67; overall 92.97% stmt / 90.97% branch
- `cd api && npm run build` -> pass; dist/ deleted afterward
- `cd api && npm run dev` + `npm run smoke:test` -> pass, 7/7
- `cd frontend && npm run typecheck` -> pass
- `cd frontend && npm run scan:legacy` -> pass
- Scratch ESLint checks for anti-corruption-layer enforcement (cross-adapter import, outside-adapter import) -> both correctly rejected with exit code 1
- No KNOWN BASELINE ISSUES encountered; no worktree comparison against base needed since everything passed outright.

FINDINGS:
1. MINOR (informational) -- `docs/bridge/PROGRESS.md` still shows Stage 1 as "IN PROGRESS" with "Review rounds: 0 so far" (unchanged since the initial plan commit `4404742`), even though round 1 has already happened. Per WORKFLOW.md step 9 this gets updated when the stage is marked DONE (after this review and the tutor step), so it is not yet overdue -- just flagging that it must be filled in with round count, commits, and the 3-line status for Prateek before this stage can be closed out.
2. MINOR -- `api/package.json` devDependencies add `@eslint/js`, `typescript-eslint`, and `@vitest/coverage-v8` in addition to `eslint`/`vitest`. The logged AGENTS.md exception says "add Vitest and ESLint as devDependencies." These three are standard, necessary parts of ESLint's flat-config/TypeScript setup and Vitest's coverage reporting respectively, so this is a reasonable reading of the approval, not a scope violation -- but it is worth a one-line note back in the AGENTS.md approval log for full traceability, since the log currently names only "Vitest and ESLint."
3. MINOR -- `api/src/bridge/adapters/salesforce/mapper.ts:152-156` (the branch where `TotalPrice` itself fails `centsFromDecimal`, e.g. `10.555`) and `mapper.ts:202-204` (the trailing `dealSchema.safeParse` safety net) remain uncovered by any test. Neither is a named mapped field, so it doesn't fail the DONE WHEN bar, but a future regression in either branch (e.g., an inverted condition) would ship silently. Low priority; could be picked up in a later stage's test pass.

Files reviewed (absolute paths under `C:\dev\gigops-prototype`):
- `api\src\bridge\domain\deal.ts`, `money.ts`, `normalise.ts`, `result.ts`
- `api\src\bridge\adapters\salesforce\types.ts`, `mapper.ts`
- `api\src\bridge\adapters\erpnext\types.ts`, `mapper.ts`
- `api\test\bridge\domain\*.test.ts`, `api\test\bridge\adapters\*.test.ts`
- `api\eslint.config.mjs`, `api\vitest.config.mts`, `api\package.json`, `api\.gitignore`
- `docs\bridge\MAPPING.md`, `docs\bridge\MAPPING_DRAFT.md`, `docs\bridge\PROGRESS.md`, `docs\bridge\NEEDS_YOU.md`, `docs\bridge\SPEC.md`, `docs\bridge\WORKFLOW.md`, `docs\bridge\reviews\stage-1-round-1.md`
