VERDICT: CHANGES REQUIRED

CRITERIA (Stage 1 DONE WHEN, from docs/bridge/SPEC.md):
- Zod schemas and types for Deal, Customer, Invoice -> met. `api/src/bridge/domain/deal.ts:9-59` defines `billingAddressSchema`, `dealLineSchema`, `dealSchema`, `customerSchema`, `invoiceSchema`; tested in `api/test/bridge/domain/deal.test.ts`.
- Mapper Salesforce Opportunity/Account -> Deal -> met. `api/src/bridge/adapters/salesforce/mapper.ts:18-208` (`mapOpportunityToDeal`); tested in `api/test/bridge/adapters/salesforce-mapper.test.ts` (12 tests, all passing).
- Mapper Deal -> ERPNext Customer/Sales Invoice payloads -> met. `api/src/bridge/adapters/erpnext/mapper.ts:16-48`; tested in `api/test/bridge/adapters/erpnext-mapper.test.ts`.
- docs/bridge/MAPPING.md written (starting from MAPPING_DRAFT.md) -> met. `docs/bridge/MAPPING.md` exists, promoted from the draft, with a table mapping each decision to Stage 1 code vs. documented-only (commit `7a7e9b1`).
- Unit tests cover every mapped field, money as integer minor units (never floats), currency, missing optional fields, and invalid input rejected with clear errors -> **not fully met**. See Finding 1: four of the per-line validation branches in the Salesforce mapper (quantity <= 0, discount out of 0-100 range, missing description with no product-name fallback, missing `TotalPrice`) are never exercised by any test (`npx vitest run --coverage` shows `adapters/salesforce/mapper.ts` at only 80.2% branch coverage; confirmed by grepping the test suite for each error string -- none appear).
- No Salesforce or ERPNext types imported outside the adapter folders -> met in practice (`grep -rn "RawSalesforce|ErpCustomerPayload|ErpSalesInvoice" api/src` returns only the four adapter files) but the enforcement mechanism has a gap -- see Finding 2.

TESTS:
- `cd api && npm ci` -> pass (222 packages installed from lock file, no lock changes)
- `cd api && npm run typecheck` -> pass, no output/errors
- `cd api && npm run lint` -> pass, no output/errors
- `cd api && npm test` (`vitest run`) -> pass, 5 files / 59 tests, all green
- `cd api && npm run build` -> pass; `dist/` produced then deleted per WORKFLOW instruction
- `cd api && npm run dev` + `npm run smoke:test` -> pass, 7/7 smoke checks green
- `npx vitest run --coverage` (ad hoc, to verify the DONE WHEN coverage claim) -> 59/59 pass; `adapters/salesforce/mapper.ts` 81.9% stmt / 80.2% branch / 50% funcs / 80.68% lines
- `cd frontend && npm run typecheck` -> pass (frontend untouched by this stage, run per WORKFLOW COMMANDS anyway)
- `cd frontend && npm run scan:legacy` -> pass
- `cd frontend && npm run verify` -> pass (build + typecheck succeeded on this machine)
- No KNOWN BASELINE ISSUES were hit; no need for a base-commit worktree comparison since everything passed outright.

FINDINGS:
1. MAJOR -- `api/src/bridge/adapters/salesforce/mapper.ts:110-134` (per-line validations for quantity, discount, description-fallback, and missing `TotalPrice`) have zero test coverage. Specifically, no test in `api/test/bridge/adapters/salesforce-mapper.test.ts` ever triggers: "must have a quantity greater than 0" (line 111), "has an invalid discount percentage" (line 125), "has no description and no product name to use as a fallback" (line 130), or "is missing a TotalPrice to verify against" (line 134). The spec's DONE WHEN explicitly requires tests covering "every mapped field... and invalid input rejected with clear errors"; Quantity and Discount are named mapped fields in MAPPING.md Decision 1's table, and their invalid-input paths are currently unverified. A regression (e.g. an inverted comparison, such as `item.Quantity >= 0` instead of `<= 0`) would ship silently. Fix: add cases for a zero/negative quantity, a discount below 0 or above 100, a line with neither `Description` nor `ProductName`, and a line missing `TotalPrice` entirely, each asserting the specific error message.

2. MINOR -- `api/eslint.config.mjs:32-34` disables `no-restricted-imports` entirely for files inside `adapters/salesforce/**` and `adapters/erpnext/**`, rather than only exempting self-references to each folder's own `types.ts`. As written, a file inside `adapters/salesforce/` could import `adapters/erpnext/types` (or vice versa) without triggering the rule, which weakens the anti-corruption-layer guard the rule is meant to enforce. No such cross-import exists today, but the automated check would not catch one if introduced later. Fix: scope the override more narrowly, e.g. only disable the restriction on the matching vendor's own `types` path (via a second, more specific pattern) rather than turning the rule off for the whole directory.

3. MINOR -- `docs/bridge/MAPPING_DRAFT.md` is still present and unchanged alongside the new `docs/bridge/MAPPING.md`, even though the commit message says it was "promoted." Keeping both invites drift (someone edits the draft later, not realizing `MAPPING.md` is now the source of truth). Not required by SPEC.md to delete, but worth a one-line note in `MAPPING_DRAFT.md` pointing to `MAPPING.md`, or removing it, in a follow-up.

4. MINOR (informational, not blocking) -- Stage 1's new devDependencies (`eslint`, `typescript-eslint`) introduce 10 new moderate-severity `npm audit` advisories (transitive `minimatch`/`@eslint/config-array`); the 4 higher-severity ones (`proxy-addr`, `qs`, `body-parser`, `zod`) are pre-existing at the base commit (confirmed via `git show c5bb8d0:api/package.json`, same `express`/`zod` versions) and are not introduced by this stage. The new ones are dev-only tooling, consistent with the AGENTS.md-logged exception, so no action required now, but worth keeping in mind before Stage 9.

Files reviewed (all absolute paths under `C:\dev\gigops-prototype`):
- `api\src\bridge\domain\deal.ts`, `money.ts`, `normalise.ts`, `result.ts`
- `api\src\bridge\adapters\salesforce\types.ts`, `mapper.ts`
- `api\src\bridge\adapters\erpnext\types.ts`, `mapper.ts`
- `api\test\bridge\domain\*.test.ts`, `api\test\bridge\adapters\*.test.ts`
- `api\eslint.config.mjs`, `api\vitest.config.mts`, `api\package.json`, `api\.gitignore`
- `docs\bridge\MAPPING.md`, `docs\bridge\MAPPING_DRAFT.md`, `docs\bridge\PROGRESS.md`, `docs\bridge\NEEDS_YOU.md`, `docs\bridge\SPEC.md`, `docs\bridge\WORKFLOW.md`
