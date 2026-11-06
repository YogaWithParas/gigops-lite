#!/usr/bin/env node
// Stop gate: keeps the builder working only while a bridge run is marked in progress.
// Blocks (forces continuation) ONLY when .claude/bridge-run.on exists. WORKFLOW.md
// requires every bridge session to create that file when a run starts or resumes, and
// delete it before stopping for any reason -- so once it's gone, this hook always lets
// Claude stop (including for sessions doing unrelated, non-bridge work).
// Safety valve: after 25 forced continuations it lets Claude stop anyway.
//
// Rewritten as Node.js (from the original stop-gate.sh) because bash is not reliably
// runnable from this project's settings.json on Windows: cmd.exe (the shell Windows
// uses to run hook commands) does not understand bash's $VAR syntax, and running a
// .sh file directly is routed through a file association straight to a brand-new,
// detached Git Bash *window* instead of executing synchronously and returning output
// -- neither gives Claude Code the JSON reply a Stop hook needs.
//
// Invoked from settings.json as:
//   node -e "require(process.env.CLAUDE_PROJECT_DIR + '/.claude/hooks/stop-gate.cjs')"
// That line deliberately avoids $VAR (bash) and %VAR% (cmd.exe) shell syntax -- Node
// itself reads CLAUDE_PROJECT_DIR via process.env, so the exact same command string
// works unchanged on Windows, macOS and Linux.

const fs = require("node:fs");
const path = require("node:path");

// Swallow the hook's JSON input on stdin (same as `cat > /dev/null` in the bash version).
process.stdin.resume();
process.stdin.on("data", () => {});
process.stdin.on("end", run);
// If stdin is a TTY (no piped input, e.g. a manual test run), there is no 'end' event
// to wait for -- run immediately instead of hanging.
if (process.stdin.isTTY) {
  run();
}

function run() {
  const dir = process.env.CLAUDE_PROJECT_DIR || ".";
  const marker = path.join(dir, ".claude", "bridge-run.on");
  const counterFile = path.join(dir, ".claude", ".stop-gate-count");
  const max = 25;

  if (!fs.existsSync(marker)) {
    try { fs.unlinkSync(counterFile); } catch { /* already gone, fine */ }
    process.exit(0);
  }

  let count = 0;
  try {
    count = parseInt(fs.readFileSync(counterFile, "utf8").trim(), 10) || 0;
  } catch { /* no counter yet, starts at 0 */ }

  if (count >= max) {
    try { fs.unlinkSync(counterFile); } catch { /* already gone, fine */ }
    console.log(JSON.stringify({
      continue: false,
      stopReason: "Stop gate safety limit reached. Check .claude/bridge-run.on and docs/bridge/PROGRESS.md.",
    }));
    process.exit(0);
  }

  fs.writeFileSync(counterFile, String(count + 1));
  console.log(JSON.stringify({
    decision: "block",
    reason: "A bridge run is marked in progress (.claude/bridge-run.on exists). Re-read docs/bridge/WORKFLOW.md and PROGRESS.md and continue the current stage. Before stopping for any reason (blocked, done, or otherwise), delete .claude/bridge-run.on per the STOP GATE section of WORKFLOW.md.",
  }));
  process.exit(0);
}
