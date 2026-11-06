# Needs you
## Blocking (work is paused until these are done)

### 1. Setup checkpoint: review the harness before Stage 1 (2026-11-05)
What: setup is complete on branch feature/sf-bridge (based on main @ 5c78bf3). No bridge features exist yet.
Why only a human: you decide whether the rules, adaptations and defaults below are what you want before an autonomous session starts building.
Steps:
1. Read docs/bridge/SPEC.md, in particular the new section "Where things live in this repo".
2. Read docs/bridge/WORKFLOW.md, in particular the new sections COMMANDS, KNOWN BASELINE ISSUES and REPO RULES, plus the push-refused line under BLOCKING.
3. Read .claude/agents/blind-reviewer.md (step 3 changed to use WORKFLOW's COMMANDS) and .claude/agents/tutor.md (one line added about the legacy scan).
4. Read .claude/settings.json (extra deny rules for api/ and frontend/ .env files and for pushing to main) and CLAUDE.md (imports AGENTS.md).
5. Go through every item under "Review when you can" below, and say yes or no to each default.
How I will verify: at the start of the next session, an entry here saying "approved" (or your changes), with this item moved to Done.

### 2. Push refused: GitHub access not linked (2026-11-05)
What: `git push -u origin feature/sf-bridge` returned 403: "Claude doesn't have GitHub access to YogaWithParas/gigops-lite". The commits exist only on the local branch in the Claude session workspace, plus a backup bundle file sent in chat.
Why only a human: it needs your GitHub login and permission grant.
Steps (either one):
1. Open https://claude.ai/customize/connectors?auth_start=github&auth_start_force=1, reconnect GitHub, and make sure the YogaWithParas/gigops-lite repo is included.
2. Or open https://github.com/apps/claude/installations/select_target, choose the YogaWithParas account, and give the Claude app access to gigops-lite.
3. Come back to the same chat and say "push the branch".
Fallback without Claude: download the bundle file, then in your local clone run `git fetch <path-to>/gigops-lite-sf-bridge.bundle feature/sf-bridge:feature/sf-bridge` followed by `git push -u origin feature/sf-bridge`.
How I will verify: `git ls-remote --heads origin feature/sf-bridge` shows the same SHA as the local branch.

## Review when you can (work continued with a default)
- ERPNext does not exist in this repo yet. No ERPNext code, config or dev instance was found on main or on any feature branch. Stages 1-3 do not need one. Stage 4 (manual run) and Stage 5 (end to end) do. Default: at Stage 4 I stop and present the options with costs (for example, self-hosting free with Docker on your own PC versus a hosted trial).
- Optimistic concurrency does not exist yet either. The current idempotency is an in-memory simulation on POST /jobs (api/src/lib/idempotency.ts). The bridge builds both from scratch in stages 2 and 4.
- There is no unit test runner and no linter. Today "tests" means smoke scripts that need a running server. Default: Stage 1 adds Vitest (`npm test`) and ESLint (`npm run lint`) as free devDependencies in api/, which changes api/package-lock.json. AGENTS.md normally forbids that; WORKFLOW's REPO RULES treat SPEC.md as your explicit request.
- Stage 2 Postgres: Docker has no running engine in cloud sessions, so the default there is the local Postgres 16 server, which is a real Postgres (free). On your own PC with Docker Desktop, Testcontainers works instead. A Neon dev branch would need an account, so it is not the default.
- `frontend: npm run scan:legacy` already fails on main because README.md lines 165 and 280 name the old project while describing the scan itself. Left unfixed because it is outside the bridge scope. Suggested fix: reword those two lines to "old-project terms". Your call.
- `frontend: npm run verify` fails in the cloud sandbox only because Google Fonts is blocked there. Typecheck and the route smoke test pass.
- CHANGED on Prateek's Windows laptop (2026-11-06): the stop gate no longer reads PROGRESS.md Status at all. Prateek asked for a narrower scope: it now blocks ending the session ONLY while the marker file `.claude/bridge-run.on` exists (git-ignored; see the STOP GATE section of WORKFLOW.md). A session doing unrelated work simply never creates that file, so the gate leaves it alone -- no more need to flip Status or use /hooks to work around it. The hook itself was also rewritten from bash (stop-gate.sh) to Node.js (stop-gate.cjs): on Windows, cmd.exe cannot run the old $CLAUDE_PROJECT_DIR-based bash command, and running the .sh file directly just opened a detached Git Bash window instead of returning the JSON reply the Stop hook needs. The new command (`node -e "require(process.env.CLAUDE_PROJECT_DIR + '/.claude/hooks/stop-gate.cjs')"`) avoids both bash's $VAR and cmd's %VAR% syntax, so it runs the same way on Windows, macOS and Linux.
- The Read deny rules stop the Read tool, but not a shell command such as `cat`. The real protection is the NEVER rules and keeping real secrets out of the repo folder where possible.
- Commits are authored as "Claude <noreply@anthropic.com>" (this workspace's git identity) and carry a Co-Authored-By line. If you want a different author, tell me; I will not change it without asking.

## Done
