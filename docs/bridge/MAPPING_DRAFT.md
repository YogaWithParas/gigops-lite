# Salesforce → ERPNext mapping (draft)

Status: SUPERSEDED by docs/bridge/MAPPING.md as of Stage 1 (2026-11-10). This file is kept only for history; edit MAPPING.md, not this one.

Status: DRAFT. Decisions 1-4 agreed with Prateek on 2026-11-07. Normalisation rules approved the same day. Decisions 5-6 approved 2026-11-10. All decisions made; ready for Stage 1.
Stage 1 turns this file into docs/bridge/MAPPING.md. SPEC.md stages 5-7 must be aligned with the field list in Decision 6. Personal portfolio project.

## Principles
- Salesforce is the source of truth for the deal: what was sold, to whom, at what pre-tax price.
- ERPNext is the system of record for accounting: tax, exchange rates, credit, payment terms.
- The bridge translates, validates and verifies. It never guesses: anything ambiguous is rejected, or parked for review, with a clear plain-English message.
- Salesforce and ERPNext types stay inside the adapter folders; everything else uses our own Deal, Customer and Invoice types.

## Decision 1: Invoice lines = one line per Opportunity Product
Why: the most realistic quote-to-cash case, chosen to build real-world experience.

| Salesforce (Opportunity Product) | ERPNext (Sales Invoice Item) | Rule |
|---|---|---|
| Product2.ProductCode | item_code | Must exactly match an existing ERPNext Item; never auto-create Items |
| Quantity | qty | Must be > 0 |
| UnitPrice | rate | Pre-tax, CAD (see Decision 2) |
| Discount (%) | discount_percentage | Optional; blank = 0 |
| Description | description | Optional; falls back to the product name |
| TotalPrice | (check only) | Our calculated line total must equal it to the cent |

Rules:
- An Opportunity with no products is rejected ("Opportunity has no products").
- An unknown product code rejects the whole deal and names the code ("Product WIDGET-01 has no matching ERPNext Item").
- Control: the sum of line totals must equal the Opportunity Amount, or the deal is rejected.

## Decision 2: Money and currency = "B, phase 1" (CAD only, currency-aware code)
Why: realistic phasing; avoids switching on Salesforce multi-currency (irreversible, extra complexity) while keeping the path open.
- Salesforce stays single-currency CAD.
- In code, money is always integer cents plus an ISO 4217 currency code (e.g. `{ amount: 125000, currency: "CAD" }`). Never floats, never bare numbers.
- Apex sends the currency explicitly with every deal (the org currency, `UserInfo.getDefaultCurrency()`).
- Reject when: deal currency is not CAD; ERPNext company currency is not CAD; the customer's billing currency is not CAD.
- Salesforce pre-tax totals are the source of truth. ERPNext's net (pre-tax) total must match them to the cent. Rounded total is disabled on bridge invoices.

## Decision 3: Tax = ERPNext decides, the bridge supplies clean data and verifies
Why: tax logic lives in one place (the accounting system), so rate changes are made once.
- The bridge sends pre-tax lines plus the customer's billing address with province.
- ERPNext Tax Rules choose the Sales Taxes and Charges Template from the billing province (GST, HST or GST+PST/QST).
- After creating the invoice, the bridge checks that tax was actually applied; if not, the sync is flagged.
- Tax address = the Salesforce Account Billing Address; province is required.
- Phase 1 accepts Canadian billing addresses only; others are rejected with a clear message.
- Assumption: services, or goods delivered to the billing address.
- Not tax advice; fine for a portfolio demo, real invoicing needs an accountant's confirmation.

## Decision 4: Customer identity = exact key match, plus lookalike check with human review
Why: the standard CRM-ERP cross-reference pattern, plus data-steward judgement for unclear cases.
1. Key: the 18-character Salesforce Account ID, stored in a unique custom field `salesforce_account_id` on ERPNext Customer. Uniqueness also blocks duplicates when two deals for a new customer arrive at once.
2. Found by key → use that customer.
3. Not found → lookalike check (normalised name key; tax registration number if present):
   - possible match → park the deal as NEEDS_REVIEW, create nothing. A person links the records, then the deal is replayed.
   - no match → create the customer, then write the ERPNext customer ID back to Salesforce `Account.ERP_Customer_Id__c` (External ID, unique).
4. ERPNext "Customer Naming By" = Naming Series (e.g. `CUST-.#####`), so names never become IDs and no silent " - 1" duplicates appear.
5. Field ownership (survivorship):
   - Salesforce owns customer name and billing address; changes flow to ERPNext on the next deal.
   - ERPNext owns everything financial (credit limit, payment terms, accounts, etc.). The bridge never overwrites these.

## Data normalisation (approved 2026-11-07)
Why: tax rules (Decision 3), customer matching (Decision 4) and reconciliation (Stage 7) all compare values, so the same fact must always look the same.
Principles:
1. Normalise at the border, once: inside the adapters, so the rest of the bridge only sees clean data.
2. Keep the original; normalise a copy. Display values stay as entered (only extra spaces trimmed); matching keys are stored separately and never shown.
3. Use published standards: ISO 3166 (countries, provinces), ISO 4217 (currency), ISO 8601 (dates).
4. If a value cannot be normalised, reject it with a clear message; never guess.
5. Fix at source where possible: Salesforce State and Country/Territory Picklists are enabled in the Developer Edition org (Prateek, before Stage 5).

| Field | Messy examples | Normalised to |
|---|---|---|
| Province | "B.C.", "bc", "British Columbia" | `BC` (2-letter code) |
| Country | "Canada", "CAN", "ca" | `CA` (ISO 3166) |
| Postal code | "v6x1a1", "V6X-1A1" | `V6X 1A1`, validated against the Canadian format |
| Currency | "cad", "C$" | `CAD` (ISO 4217) |
| Money | 1250.5 | `125050` (integer cents) |
| Company name, matching key | " ACME Limited.", "Acme Ltd" | `acme` (lowercase; punctuation and Ltd/Limited/Inc/Corp removed) |
| Company name, display | "  Acme   Ltd. " | "Acme Ltd." (extra spaces trimmed only) |
| Product code | " WIDGET-01 " | `WIDGET-01` (spaces trimmed; otherwise exact) |
| Dates | Close Date | `YYYY-MM-DD`; system timestamps stored in UTC |

Database normalisation (Stage 2): the sync ledger stores IDs that point to records, not copies of customer data. Deliberate exception: a payload hash (a fingerprint of exactly what was sent) is kept as audit evidence.

## Decision 5: Invoice state and dates (approved 2026-11-10)
Why: a new integration earns trust like a new clerk: supervised first, automatic later (a maker-checker control).

Invoice state:
- The bridge creates invoices as Draft by default. Finance reviews and submits in ERPNext.
- When auto-submit is on, the bridge submits an invoice only if every check passed (products matched, totals equal, tax applied, customer clean). Any failed check leaves it as Draft and flags it.
- Mistakes on submitted invoices are fixed in ERPNext by cancel and amend, never by editing.

Dates:
- Posting (invoice) date = the date the bridge creates the invoice, calculated in the configured business time zone (not UTC). No backdating.
- The Opportunity Close Date is stored for reference and reconciliation.
- Due date comes from ERPNext payment terms. Order of precedence: the customer's own Payment Terms Template in ERPNext first; the configured default only when the customer has none.
- Close Date in the future: reject. Close Date older than the configured limit: park for review.

### Bridge settings (defaults, changeable without code changes)
Settings are read at startup from environment variables, validated with Zod, and listed with their defaults in `.env.example` (no secrets). The service refuses to start if a value is invalid. Each sync ledger entry records the settings it used, so changing a setting later never rewrites history.

| Setting | Default | Meaning | Validation |
|---|---|---|---|
| `BRIDGE_TIMEZONE` | `America/Vancouver` | Time zone used to decide the invoice date | Must be a valid IANA time zone name |
| `BRIDGE_DEFAULT_PAYMENT_TERMS` | `Net 30` | ERPNext Payment Terms Template used when a customer has none | Must exist in ERPNext (checked when the worker starts) |
| `BRIDGE_AUTO_SUBMIT` | `false` | Submit invoices automatically when all checks pass | true or false |
| `BRIDGE_MAX_CLOSE_DATE_AGE_DAYS` | `30` | Close Dates older than this are parked for review | Whole number, 1 or more |

## Decision 6: What flows back to Salesforce (approved 2026-11-10)
Why: a salesperson should see billing status without an ERPNext login, while ERPNext stays the source of truth. Salesforce shows a read-only summary, never a second ledger.

### Salesforce fields (read-only for users; only the integration user writes them)
| Object | Field | Type | Meaning |
|---|---|---|---|
| Account | `ERP_Customer_Id__c` | Text, External ID, unique | ERPNext customer ID (Decision 4) |
| Opportunity | `ERP_Invoice_Id__c` | Text, External ID, unique | ERPNext invoice number |
| Opportunity | `Invoice_Status__c` | Picklist | Normalised status (table below) |
| Opportunity | `Invoice_Total__c` | Currency | Invoice grand total, including tax |
| Opportunity | `Balance_Due__c` | Currency | Amount still outstanding, including tax |
| Opportunity | `Invoice_Due_Date__c` | Date | Due date from ERPNext payment terms |
| Opportunity | `Sync_Status__c` | Picklist | Not Sent, Pending, Synced, Needs Review, Failed |
| Opportunity | `Sync_Error__c` | Long text | Plain-English last error; no personal data |
| Opportunity | `Last_Sync_At__c` | Date/time | Stored in UTC; Salesforce shows each user's own time zone |

Invoice status (has the customer paid?) and sync status (did the bridge do its job?) are always separate fields.

### Status translation (ERPNext to Salesforce)
| ERPNext status | Salesforce `Invoice_Status__c` |
|---|---|
| Draft | Draft |
| Unpaid, Unpaid and Discounted | Awaiting Payment |
| Partly Paid | Partly Paid |
| Overdue, Overdue and Discounted | Overdue |
| Paid | Paid |
| Credit Note Issued | Credited |
| Cancelled | Cancelled |
| Any unrecognised value | Unknown (and the bridge raises an alert) |
"Return" is never mapped: it is the credit note document itself, not our invoice.

### Timing
- ERPNext events update Salesforce quickly (Stage 6).
- Time-based changes such as Overdue may not send an event, so the nightly reconciliation (Stage 7) also refreshes every open invoice's status.

### Missing fields
- Required (missing means reject, never default): Account ID and name; full billing address (street, city, province, postal code, country); Close Date; at least one product with product code, quantity and unit price; currency.
- Optional, with documented defaults: discount = 0; line description = product name; customer tax number = none (lookalike check then uses the name only); payment terms = customer's own, else `BRIDGE_DEFAULT_PAYMENT_TERMS`.
- Validation reports every problem in one message (e.g. "Missing: postal code; product WIDGET-02 has no unit price"), not one at a time.

## Phase 2 (designed for, not built)
- Multi-currency: enable Salesforce multi-currency; send the Opportunity's own currency; invoice in the deal currency using ERPNext's exchange rate; one billing currency per customer.
- Foreign customers: accept non-Canadian billing countries; ERPNext Tax Rules by country (zero-rated export template where the sale qualifies); carry the customer's tax registration number; store the billing country and address used in the sync ledger as audit evidence; consider a tax engine (paid: ask first).
- Separate ship-to address for goods.
- Salesforce Account merges (one Account ID disappears).
- Goods: create an ERPNext Sales Order at Closed Won and invoice after delivery (Quotation, Sales Order, Delivery Note, Invoice). Phase 1 invoices at Closed Won because it assumes services.

## Salesforce setup needed before Stage 5 (Prateek)
- Enable State and Country/Territory Picklists.
- (The custom fields above are created by the Stage 5 Salesforce DX project, not by hand.)

## ERPNext setup needed before Stage 4 (Prateek, via the ERPNext UI)
- An Item for every product code used in tests.
- Sales Taxes and Charges Templates and Tax Rules per province.
- Custom field `salesforce_account_id` (unique) on Customer.
- Selling Settings: Customer Naming By = Naming Series.
- Company currency CAD; rounded total disabled for bridge invoices.
- A Payment Terms Template named "Net 30" (the default for customers without their own terms).
