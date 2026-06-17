# Review Checklist

Use this checklist before merging or handing off agent-created changes.

## Scope and Safety

- [ ] Changes match the requested task.
- [ ] No unrelated files were modified.
- [ ] No route behavior changed unexpectedly.
- [ ] No dependency installs were introduced without approval.
- [ ] package-lock.json was not changed unless explicitly required.

## Product Truth

- [ ] Docs and code still reflect prototype reality.
- [ ] No claims imply Cloud Run, Firestore, Pub/Sub, Auth0, or production observability is already implemented.

## Code Quality

- [ ] Changes are readable for beginners.
- [ ] Naming is clear and consistent.
- [ ] No avoidable complexity was introduced.

## Validation

From frontend folder:
- [ ] npm run verify passes
- [ ] npm run scan:legacy passes

If routes are touched:
- [ ] npm run test:routes passes

## Reporting

- [ ] Final summary includes created files.
- [ ] Final summary includes changed files.
- [ ] Final summary includes commands run and pass/fail.
- [ ] Final summary lists remaining mock/planned areas.
