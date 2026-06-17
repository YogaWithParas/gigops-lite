# Definition of Done

A task is done when all criteria below are met.

## Functional Completion

- Requested files are created or updated.
- Behavior matches requested scope.
- No accidental route contract changes.

## Quality Completion

- Code and docs are concise and readable.
- Prototype truth is preserved.
- No hidden dependency or infra changes.

## Validation Completion

From frontend folder:
- npm run verify succeeds
- npm run scan:legacy succeeds

If the task includes route changes or route-adjacent logic:
- npm run test:routes succeeds

## Reporting Completion

Final report includes:
- Files created
- Files changed
- Commands run
- Pass/fail status
- Remaining mock/planned components

If any item fails, task is not done.
