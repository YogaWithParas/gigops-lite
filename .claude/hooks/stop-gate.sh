#!/usr/bin/env bash
# Stop gate: keeps the builder working until the project is done or waiting on Prateek.
# Lets Claude stop when PROGRESS.md Status is SETUP COMPLETE, BLOCKED: waiting on human, or ALL STAGES DONE.
# Safety valve: after 25 forced continuations it lets Claude stop.
set -euo pipefail
cat > /dev/null   # read and ignore the hook's JSON input
DIR="${CLAUDE_PROJECT_DIR:-.}"
PROGRESS="$DIR/docs/bridge/PROGRESS.md"
COUNTER="$DIR/.claude/.stop-gate-count"
MAX=25
if [ ! -f "$PROGRESS" ]; then exit 0; fi
if grep -qE '^Status: (SETUP COMPLETE|BLOCKED: waiting on human|ALL STAGES DONE)' "$PROGRESS"; then
  rm -f "$COUNTER"; exit 0
fi
COUNT=$(cat "$COUNTER" 2>/dev/null || echo 0)
if [ "$COUNT" -ge "$MAX" ]; then
  rm -f "$COUNTER"
  echo '{"continue": false, "stopReason": "Stop gate safety limit reached. Check docs/bridge/PROGRESS.md."}'
  exit 0
fi
echo $((COUNT + 1)) > "$COUNTER"
echo '{"decision": "block", "reason": "The bridge is not finished and you are not waiting on Prateek. Re-read docs/bridge/WORKFLOW.md and PROGRESS.md and continue the current stage. If only a human can do the next step, follow the BLOCKING procedure in WORKFLOW.md before stopping."}'
