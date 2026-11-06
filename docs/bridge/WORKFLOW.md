# Bridge build workflow (read at the start of every session)
ROLES
- Builder: the main session. Plans and writes code, one stage at a time.
- blind-reviewer: subagent. Independent review; never sees the builder's plan or reasoning.
- tutor: subagent. Writes a lesson for each finished stage.

STOP GATE
The Stop hook (.claude/hooks/stop-gate.cjs, a Node.js script -- see its header comment for why a Windows-reliable rewrite replaced the original bash version) blocks the session from ending ONLY while the marker file `.claude/bridge-run.on` exists. That file is git-ignored -- it is a local marker on this machine, not repo content, so it never gets committed.
- Create it (for example `touch .claude/bridge-run.on`) as the first action of every bridge run, whether starting fresh or resuming (see step 1 of THE LOOP below).
- Delete it before stopping for ANY reason: a BLOCKING escalation, all stages DONE, or any other point where the session is about to end. If it is not deleted, the hook keeps forcing the session to continue even after there is nothing left to do.
- A session doing work unrelated to the bridge should simply never create this file, so the gate leaves it alone.

THE LOOP FOR EACH STAGE
1. Create `.claude/bridge-run.on` if it does not already exist. Read PROGRESS.md, SPEC.md and NEEDS_YOU.md. Pick the first stage that is not DONE.
2. Record the base commit (git rev-parse HEAD) in PROGRESS.md.
3. Write a 5-10 line plan in PROGRESS.md: files to touch, tests to add.
4. Build in small steps, tests first where practical. Commit after each green step; commit messages explain why.
5. Self-check: run every command under COMMANDS below (typecheck, lint, full test suite). All must pass.
6. Blind review: invoke blind-reviewer with ONLY the stage number, the path docs/bridge/SPEC.md and the base commit SHA. Do not pass your plan, notes or explanations. Save its full report to docs/bridge/reviews/stage-N-round-M.md.
7. CHANGES REQUIRED: fix every BLOCKER and MAJOR finding, self-check again, then invoke a NEW blind-reviewer with the same three inputs. Maximum 3 rounds; still failing after round 3 -> BLOCKING escalation.
8. PASS: invoke tutor with the stage number and the base SHA.
9. Mark the stage DONE in PROGRESS.md (summary, commits, review rounds, open MINOR items, and a 3-line plain-English status for Prateek). Commit and push the branch.
10. Continue with the next stage without asking.

COMMANDS (this repo; added during setup)
There is no root package.json. Run commands inside api/ or frontend/. If node_modules is missing, run `npm ci` first: it installs exactly what the lock file says and does not change it.
API (all bridge code lives here):
- `cd api && npm run typecheck`
- `cd api && npm run build` (then delete api/dist; it is git-ignored but should not linger)
- `cd api && npm test` and `cd api && npm run lint`: these scripts do not exist yet. Stage 1 adds them (Vitest for tests, ESLint for lint). From then on they are part of every self-check and every review.
- Smoke test: start the API with `cd api && npm run dev` (port 4000), then in another shell `cd api && npm run smoke:test`.
Frontend (run for full-suite checks and whenever frontend/ or README.md changes):
- `cd frontend && npm run typecheck`
- `cd frontend && npm run scan:legacy` (fails if README.md, docs/ or frontend source contain old-project words; see KNOWN BASELINE ISSUES)
- `cd frontend && npm run verify` (production build + typecheck; needs internet access to Google Fonts)
- Route smoke test: start `cd frontend && npx next dev -p 3000`, then `npm run test:routes`.
Postgres (stage 2 onward, sync ledger tests, this machine): a docker-compose file is committed at `api/docker-compose.bridge-db.yml`. It starts one postgres:16 container, host port 5433 (chosen to avoid clashing with any other local Postgres), with a named volume so data survives restarts. Credentials come from `api/.env` (copy `api/.env.example` and fill in a local password; `.env` is git-ignored). Start it with `cd api && docker compose -f docker-compose.bridge-db.yml up -d`. Stage 2 integration tests connect using `BRIDGE_DATABASE_URL` from `api/.env`.
Salesforce (stage 5 onward): commands are added to this section when the salesforce/ project is created.

KNOWN BASELINE ISSUES (found at setup on main @ 5c78bf3; not caused by the bridge)
- `frontend: npm run scan:legacy` already fails on main: README.md lines 165 and 280 name the old project while describing the scan itself. A check that fails at the base commit with the same output is not a bridge regression: report it, do not fix it in a bridge stage unless Prateek says so (logged in NEEDS_YOU.md). RESOLVED on Prateek's Windows laptop (2026-11-06): Prateek approved rewording those two lines; `scan:legacy` now passes. No longer a baseline issue on this machine.
- `frontend: npm run verify` fails in cloud sandboxes that block Google Fonts ("Failed to fetch `Geist Mono`"). That is an environment limit. In that case run typecheck plus the route smoke test, and say so in the report.
- Docker has no running engine in cloud sandboxes, so Testcontainers will not work there. A local Postgres 16 server (`/usr/lib/postgresql/16/bin`) is available as a real Postgres for stage 2. On Prateek's Windows laptop Docker Desktop IS available: use the committed `api/docker-compose.bridge-db.yml` (see Postgres line above) as the default for stage 2, instead of Testcontainers or a bare local Postgres server.

REPO RULES
AGENTS.md (the repo's general agent rules) still applies. Where it conflicts with SPEC.md for bridge work (it says not to add dependencies, persistence or auth in prototype tasks), SPEC.md counts as Prateek's explicit request, but only for what the current stage needs. Keep package-lock.json changes to dependencies the stage actually uses. Never change existing GigOps routes or UI behaviour.

STOP AND ASK (BLOCKING) ONLY FOR WHAT ONLY A HUMAN CAN DO
- creating or logging into accounts; browser logins such as sf org login web
- creating a Salesforce External Client App or uploading a certificate
- entering secret values anywhere (you may create .env.example with placeholders)
- anything that costs money or changes billing; choosing between options with different costs
- merging to the default branch, making anything public, deploying to production
- deleting or overwriting real data
- legal or employment questions
- 3 failed review rounds, or a spec contradiction with no reasonable default
How: first finish any work that does not depend on the blocker. Then add an entry to NEEDS_YOU.md (what, why only a human, exact numbered steps, how you will verify it), set Status to "BLOCKED: waiting on human", delete `.claude/bridge-run.on` (see STOP GATE above), commit, push and stop. Your final message repeats the steps.
If a push is refused (for example, GitHub access not linked), keep the commits on the local branch, record the refusal in NEEDS_YOU.md, and continue; do not retry with other push methods.

REVIEW WHEN YOU CAN (NON-BLOCKING)
Defaults and assumptions you chose (field mapping, naming, draft vs submitted invoices): log them in NEEDS_YOU.md under "Review when you can" and keep going.

NEVER
- commit secrets, tokens or private keys, or print them in logs
- skip, delete or weaken tests, or edit .claude/agents, .claude/hooks or .claude/settings.json to get past a gate
- force-push, rewrite shared history, or commit to the default branch
- add paid services without asking
- touch real production systems; use the dev org, the test ERPNext and local data only

DONE
All stages DONE, all tests pass, PR open. Set Status to "ALL STAGES DONE", delete `.claude/bridge-run.on` (see STOP GATE above), commit, push and stop with a summary.

WRITING FOR PRATEEK
Simple English. Define each technical term where it first appears. Story or analogy first, then the technical detail. A mermaid diagram when there is a flow.
