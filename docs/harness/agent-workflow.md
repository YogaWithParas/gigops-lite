# Agent Workflow

This page describes the default execution loop for AI coding agents in GigOps Lite.

## 1. Perceive

- Read the task fully.
- Inspect only relevant source and docs.
- Confirm whether the task is frontend, mock API, docs, or scripts.
- Re-state constraints before editing.

## 2. Plan

- List exact files expected to change.
- List exact commands to validate.
- Choose minimal edits first.

## 3. Act

- Implement targeted changes.
- Keep wording and code easy to follow.
- Preserve route behavior unless task explicitly requires change.

## 4. Observe

- Run validation commands.
- Capture pass or fail.
- If failures appear, apply smallest fix and re-run.

## 5. Report

- Files created
- Files changed
- Commands run
- Result summary
- What is still mock/planned

## Default Validation for Frontend Work

From frontend folder:

- npm run verify
- npm run scan:legacy

## Escalation Rules

- If a task requires large rewrite, pause and ask.
- If requested change conflicts with project truth, call out the conflict.
- If more than expected files must change, explain why before continuing.
