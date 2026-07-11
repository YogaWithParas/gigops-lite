# GigOps Lite Auth and RBAC

Auth is not implemented yet. The future plan is to use Auth0 with role-based access control.

## V1 Mock Persona Switcher

The frontend has a "Viewing as: Client / Worker / Ops" switcher (`frontend/lib/persona-context.tsx`,
`frontend/components/app-shell.tsx`) that changes which nav items and demo data are shown. It is a
client-side-only convenience for demoing all three personas without building real login — it is
**not** a security boundary. Every route stays reachable by URL regardless of the selected role.
Real role enforcement is still planned via Auth0, per the roles and permission goals below.

## Planned Roles

- Client: creates and reviews jobs.
- Worker: receives tasks and submits work.
- QA reviewer: approves, corrects, or escalates work.
- Admin: monitors payout, audit, and operational health.

## Permission Goals

- Clients can create and inspect their own jobs.
- Workers can only see assigned or eligible tasks.
- QA reviewers can update review status and notes.
- Admins can inspect audit logs, payout status, and cross-tenant metrics.

## Implementation Notes

- Preserve role claims in the ID token.
- Gate future API routes by role and tenant.
- Keep the frontend tolerant of unauthenticated mock mode for now.
