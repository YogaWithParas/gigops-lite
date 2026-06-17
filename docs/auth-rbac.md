# GigOps Lite Auth and RBAC

Auth is not implemented yet. The future plan is to use Auth0 with role-based access control.

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
