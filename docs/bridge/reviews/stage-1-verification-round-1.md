VERDICT: CHANGES REQUIRED

CRITERIA:
- Deal, Customer and Invoice Zod schemas and types -> met, api/src/bridge/domain/deal.ts:9-59.
- Salesforce Opportunity/Account -> Deal and Deal -> ERPNext payload mappings -> implemented, but correctness incomplete; Findings 1-2.
- MAPPING.md -> met; documents mappings and later-stage responsibilities.
- Every mapped field, currency and missing optional fields covered by unit tests -> existing field/default tests pass; monetary rounding and mismatched-account cases missing.
- Money uses integer minor units or decimal arithmetic, never floats -> not met: salesforce/mapper.ts:151 uses binary floating-point arithmetic.
- Invalid input rejected with clear errors -> not fully met: mismatched Account accepted.
- No vendor types imported outside adapter folders -> met for production source. Tests import Salesforce fixture types.

FINDINGS:
1. MAJOR - api/src/bridge/adapters/salesforce/mapper.ts:151. Math.round(quantity * unitPriceCents * (1 - discountPercent / 100)) rejects quantity 1, UnitPrice 0.05, Discount 90, TotalPrice 0.01 with calculated 0 cents. Use exact decimal or scaled-integer/rational arithmetic and explicit rounding; add half-cent, fractional-quantity and fractional-discount tests.
2. MAJOR - api/src/bridge/adapters/salesforce/mapper.ts:26-28,185. Opportunity.AccountId is never compared to Account.Id. Mismatched 001000000000002AAA and 001000000000001AAA return success, risking invoicing the wrong customer. Reject mismatches and add regression test.

TESTS:
- API typecheck, lint, build PASS; 67 tests PASS; smoke 7 checks PASS.
- Frontend typecheck, scan:legacy, verify PASS; routes 8 UI + 4 API PASS.
- Mismatch and half-cent reproductions confirmed defects.
- Extra frontend dev launch failed because port 3000 occupied; route checks used existing server.
- Reviewer edited no source. Build generated api/dist and frontend/next-env.d.ts; parent notified to clean up.
