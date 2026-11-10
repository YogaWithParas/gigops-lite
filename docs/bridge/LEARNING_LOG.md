# Learning log
One lesson per finished stage, newest at the bottom.

## Stage 1: Domain model and anti-corruption layer

### 1. The story
When your distribution business took orders from different customers, each one's paperwork looked different: some weighed goods in kilograms, some counted cases, some called a product "SKU-100" and others "Widget Red-100". You likely had one intake clerk whose only job was to translate every incoming order into your own standard format before it ever touched the warehouse system -- so the rest of the business never had to relearn a new format for every customer. This bridge project does the same thing in code. Salesforce (the sales side) and ERPNext (the accounting side) each have their own data shapes and vocabulary, and one small, clearly marked piece of code -- the adapter -- is the only place allowed to speak either vendor's language. Everything else only ever sees our own plain "Deal", "Customer" and "Invoice" shapes, so if a vendor changes a field name tomorrow, only the adapter has to change.

### 2. New terms
- Domain model: our own plain description of the business objects (Deal, Customer, Invoice) that has nothing to do with any particular vendor's software.
- Anti-corruption layer: a small, deliberately isolated piece of code that translates an outside system's data into our own domain model, so the outside system's quirks never spread into the rest of the code.
- Adapter: the actual folder where that translation happens for one specific vendor (the Salesforce adapter, the ERPNext adapter).
- Zod schema: code that both describes the shape of data (which fields, what types) and checks real data against that shape while the program runs, rejecting anything that does not fit.
- Mapper: a function that takes data in one shape and produces data in another shape, for example turning a raw Salesforce Opportunity into our own Deal.
- Result type: a way for a function to return either a successful value or a list of error messages, instead of throwing an exception.
- Minor units (integer cents): storing money as a whole number of the smallest unit (cents) instead of a decimal number, so the computer never has to round a fraction.
- Blind review: a second pass where a reviewer checks the finished work against the written spec without being told in advance what to look for, to catch gaps the builder missed.

### 3. How it works
```mermaid
flowchart LR
    SF["Salesforce Opportunity + Account (raw)"] -->|mapOpportunityToDeal| ADPT_SF[Salesforce adapter]
    ADPT_SF -->|validated and converted| DEAL[("Deal" domain object)]
    DEAL -->|dealToCustomer / dealToInvoice| DOM[("Customer" + "Invoice" domain objects)]
    DOM -->|mapCustomerToErpPayload / mapInvoiceToErpPayload| ADPT_ERP[ERPNext adapter]
    ADPT_ERP --> ERP["ERPNext Customer + Sales Invoice payload"]
```
Raw Salesforce data enters only through the Salesforce adapter, which checks every field, converts money and dates, and either hands back a clean `Deal` or a list of plain-English errors -- it never does both halfway. Past that point, nothing in the code knows Salesforce exists; two small functions (`dealToCustomer`, `dealToInvoice`) turn the `Deal` into a `Customer` and an `Invoice` using only our own types. The ERPNext adapter is the only place that knows how ERPNext wants its fields shaped, and it only ever runs on these clean domain objects, never on raw Salesforce data. A linting rule backs this up by blocking vendor-specific imports outside the two adapter folders.

### 4. Where it lives
- Read first: `api/src/bridge/domain/deal.ts` (the Deal/Customer/Invoice shapes)
- Then: `api/src/bridge/domain/money.ts`, `api/src/bridge/domain/normalise.ts`, `api/src/bridge/domain/result.ts`
- Then: `api/src/bridge/adapters/salesforce/mapper.ts` and `types.ts`
- Then: `api/src/bridge/adapters/erpnext/mapper.ts` and `types.ts`
- Decisions and reasoning: `docs/bridge/MAPPING.md`
- Tests: `api/test/bridge/domain/*.test.ts` and `api/test/bridge/adapters/*.test.ts`
- The review that found a gap before the stage was marked done: `docs/bridge/reviews/stage-1-round-1.md`

### 5. Interview soundbite
"In a personal project, I built an anti-corruption layer so Salesforce and ERPNext types never leak outside two adapter folders -- everything else uses my own Deal, Customer and Invoice types. I stored money as integer cents instead of decimals to avoid rounding bugs, and a blind review caught a test-coverage gap in my line-item validation before I called the stage done."

### 6. Try it yourself (optional, ~20 minutes)
Open `api/src/bridge/adapters/salesforce/mapper.ts` and `api/test/bridge/adapters/salesforce-mapper.test.ts` side by side. Pick one validation rule you can see in the mapper (for example, "must have a quantity greater than 0") and write a small test input that should trigger it, following the pattern of the existing tests. Run `npx vitest run` inside `api/` and check that your new test passes and reports the exact error message.

### 7. Check yourself
<details>
<summary>Q1: Why is money stored as integer cents (e.g. 125050) instead of a decimal like 1250.50?</summary>
Computers cannot represent every decimal fraction exactly in binary, so repeated math on decimal numbers slowly introduces rounding errors. A whole number of cents has no fraction to round, so the math stays exact.
</details>
<details>
<summary>Q2: What is the one rule the anti-corruption layer enforces about Salesforce and ERPNext types?</summary>
Those vendor-specific types may only be imported inside the salesforce/ and erpnext/ adapter folders; every other file in the project only sees our own Deal, Customer and Invoice types.
</details>
<details>
<summary>Q3: What did the blind review catch in Stage 1, and why did it matter?</summary>
It found that four error paths in the line-item validation (for example, a zero quantity or a bad discount percentage) had no test covering them, so a future bug in that code could ship without any test ever failing.
</details>
