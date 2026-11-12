# Progress
Status: SETUP COMPLETE
(Allowed values: IN PROGRESS | SETUP COMPLETE | BLOCKED: waiting on human | ALL STAGES DONE)
Current stage: 1 DONE; next is Stage 2 (sync ledger and idempotency), not started

| Stage | Status | Base SHA | Review rounds | Summary |
|---|---|---|---|---|
| 0 (setup) | DONE | 5c78bf3 | n/a (setup only) | Harness created: spec, workflow, progress, needs-you, learning log, blind-reviewer and tutor agents, stop-gate hook, settings, ignore rules. Existing checks at base: api typecheck/build/smoke PASS; frontend typecheck and route smoke PASS; frontend scan:legacy FAIL (pre-existing); frontend build FAIL in cloud only (Google Fonts blocked). Push refused (GitHub access), see NEEDS_YOU.md. |
| 0 (setup, Windows laptop) | DONE | 5cede14 | n/a (setup only) | Finished setup on Prateek's Windows laptop: rewrote the stop gate as Windows-reliable Node.js and scoped it to a .claude/bridge-run.on marker; started the local bridge Postgres (docker-compose, port 5433) and proved a real connection; confirmed the local ERPNext instance (frappe_docker) is reachable; logged the Stage 4 ERPNext integration-user ask in NEEDS_YOU.md; re-ran every stop-gate scenario and the full WORKFLOW.md command checklist, all PASS; pushed feature/sf-bridge to origin. |
| 1 (domain + anti-corruption layer) | DONE | c5bb8d0 | 2 (round 1: CHANGES REQUIRED; round 2: PASS) | Built Deal/Customer/Invoice Zod domain types, money-as-cents, and the MAPPING.md normalisation rules; the Salesforce Opportunity/Account -> Deal mapper (field mapping, line-total and sum-of-lines controls, CAD-only check, reports every problem at once); the Deal -> ERPNext Customer/Sales Invoice payload mapper; promoted MAPPING.md from the draft with a built-vs-documented-only table; added Vitest + ESLint (approved exception) including an eslint rule enforcing the anti-corruption layer. 67 unit tests, 92.97%/90.97% stmt/branch coverage. Round 1 found 1 MAJOR (4 untested per-line validation branches) + 3 MINOR (eslint rule too broad, stale draft doc, npm audit note); all fixed, round 2 PASS with 3 MINOR informational items left open (see docs/bridge/reviews/stage-1-round-2.md). Lesson: docs/bridge/LEARNING_LOG.md. |

### Stage 1 status for Prateek (plain English)
1. The bridge can now read a Salesforce deal, turn it into our own clean "Deal" shape, and turn that into the two payloads ERPNext will eventually need (a Customer and a Sales Invoice) -- all covered by 67 automated tests, with nothing talking to a real Salesforce or ERPNext yet.
2. Two independent reviews ran against this stage: the first caught a real gap (some error paths, like a bad discount percentage, weren't tested) and a lint rule that was looser than intended; both are fixed and the second review passed clean.
3. Three small open items are logged as non-blocking in the stage-1-round-2.md review and don't need your attention now: PROGRESS.md needed this update (done), a couple of defensive code paths stay untested (low risk, not a named field), and the exact extra tooling packages installed are now logged for traceability.

## Stage 1 plan (base c5bb8d0) -- for reference, now complete
Files touched: `api/package.json`/`package-lock.json` (Vitest + ESLint devDependencies, approved exception); `api/src/bridge/domain/{money,normalise,deal,result}.ts`; `api/src/bridge/adapters/{salesforce,erpnext}/{types,mapper}.ts`; `api/test/bridge/**`; `docs/bridge/MAPPING.md`; `api/eslint.config.mjs`. Scope was exactly SPEC.md Stage 1's DONE WHEN -- no tax, no customer matching/find-or-create, no draft/submit, no persistence. Those stay documented only in MAPPING.md for later stages.

## Stage 1 verification continuation (2026-11-11)
Base at resume: 4a598bfb567cb791ab6f79c71b0d1f979ce074d0; matched origin/feature/sf-bridge before changes.
Plan: preserve completed housekeeping and Stage 1 commits; correct stale workflow headings; rescan owner history; independently review Stage 1; add regression tests before any fixes; rerun checks; update lesson and report; push only feature/sf-bridge; remove run marker and stop without Stage 2.
- aa1f157: housekeeping corrections only.
- 0a08d23: exact decimal line totals and AccountId consistency; new regression tests first failed (2 failures), then 81 total tests passed.
- Fresh verification round 1: CHANGES REQUIRED, two MAJOR findings. Round 2 pending.

- Verification round 2: one MAJOR domain-validation gap and one MINOR oversized-conversion defect. Added 12 cases first (11 failed, one valid control passed); implemented shared schema invariants and exact safe-range conversion. Now 93 tests pass.
- Closed Stage 1's two outstanding MINOR items from the original round-2 review (docs/bridge/reviews/stage-1-round-2.md), test first:
  - `23c2c71`: `decimalFromCents` (money.ts) built an exact decimal string but returned `Number()` of it uncollected -- at very large cent amounts (near `Number.MAX_SAFE_INTEGER`) that silently rounds, so two different cent values could collapse to the same decimal and drop a cent. Added a failing test (confirmed it failed against the old code), then made it throw instead of returning a lossy amount, detected by round-tripping through `centsFromDecimal`'s exact BigInt parsing.
  - `72e2562`: the ERPNext mapper test fixture (`validDeal()` in erpnext-mapper.test.ts) had `amount` (125000 cents) not equal to the sum of its line totals (112500 cents) -- undetected because the fixture was a plain object literal typed as `Deal`, bypassing `dealSchema`'s runtime invariant checks entirely. Fixed the total and changed the fixture to `dealSchema.parse(...)`; proved the guard by temporarily reintroducing the bad total (test failed with Zod's own message) then reverting (test passed).
  - Full COMMANDS checklist re-run after both fixes, all green: api typecheck/lint/test (94 tests)/build/smoke (7/7); frontend typecheck/scan:legacy/verify/route smoke (8 UI + 4 API). 93.61%/92.65% stmt/branch coverage.
  - Both items closed. The one remaining round-2 MINOR item (two defensive, unreachable-in-practice branches in the Salesforce mapper left untested) was not touched -- out of scope for what was asked this run.
