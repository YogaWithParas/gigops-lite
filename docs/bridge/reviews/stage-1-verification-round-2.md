VERDICT: CHANGES REQUIRED

CRITERIA:
- Unit tests cover every mapped field → met. Full-object assertions in `salesforce-mapper.test.ts`, `erpnext-mapper.test.ts`, and `deal.test.ts` cover the mapped fields.
- Money uses integer minor units or decimal arithmetic → met for mapped deals. `calculateLineTotalCents` uses exact BigInt ratios and rejects unsafe results; money schemas reject unsafe integers.
- Currency → partially met. Salesforce mapping normalizes currency and rejects non-CAD deals, but domain schemas accept contradictory currencies within a deal.
- Missing optional fields → met. Missing discount defaults to zero; missing description falls back to product name.
- Invalid input rejected with clear errors → not met at the domain validation boundary. The Deal schema accepts invalid calendar dates, invalid Canadian address values, inconsistent currencies, and inconsistent totals.
- Vendor types remain inside adapters → met in production source. Adapter tests import vendor types solely for fixtures.
- Mapping documentation → met. `docs/bridge/MAPPING.md` distinguishes implemented behavior from later stages.

FINDINGS:
1. MAJOR — `api/src/bridge/domain/deal.ts:27`: `dealSchema` validates individual shapes but does not enforce the business invariants that make a Deal valid. An independent runtime probe successfully parsed a deal with `closeDate: "2026-02-30"`, province `"ZZ"`, postal code `"invalid"`, top-level CAD currency, USD amount, EUR unit price, JPY line total, and inconsistent totals. This schema is the reusable domain validation boundary, including for the planned inbound API; callers bypassing the Salesforce mapper can therefore introduce invalid financial data. Reuse the address/date validators and add currency/total refinements. Test these cases directly against Deal and corresponding Customer/Invoice schemas.
2. MINOR — `api/src/bridge/domain/money.ts:25`: `centsFromDecimal` reports success after losing precision for oversized inputs. Reproduced: `"9007199254740993.01"` returns `{ ok: true, value: 900719925474099200 }`. Current downstream line calculation/schema checks prevent this becoming a valid mapped Deal, but the exported conversion primitive violates its exactness contract. Parse using BigInt and reject values outside the safe integer range before converting to Number; add boundary tests.

TESTS:
- API `npm run typecheck`: PASS.
- API `npm run lint`: PASS.
- API `npm test`: PASS, 5 files / 81 tests.
- API `npm run build`: PASS.
- API `npm run smoke:test`: PASS, 7 check groups.
- Frontend `npm run typecheck`: PASS.
- Frontend `npm run scan:legacy`: PASS.
- Frontend `npm run verify`: PASS.
- Frontend `npm run test:routes`: PASS, 8 UI routes / 4 API routes.
- Independent runtime probes reproduced both findings.
- Initial permission-related failures were resolved by rerunning with authorized filesystem/network access; no unresolved test failures.
- No source files modified. API build output requires cleanup by the builder.
