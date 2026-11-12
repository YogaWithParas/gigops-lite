import { z } from "zod";
import { calculateLineTotalCents, moneySchema, type Money } from "./money";
import { normaliseCompanyNameKey, normaliseIsoDate, normalisePostalCode, normaliseProvince } from "./normalise";

// Our own Deal, Customer and Invoice types (docs/bridge/SPEC.md, Stage 1).
// No Salesforce or ERPNext types are used here -- only the adapter folders
// may import those.

export const billingAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  province: z.string().refine((value) => { const result = normaliseProvince(value); return result.ok && result.value === value; }, "Expected a Canadian province code"),
  postalCode: z.string().refine((value) => { const result = normalisePostalCode(value); return result.ok && result.value === value; }, "Expected a normalized Canadian postal code"),
  country: z.string().refine((value): boolean => value === "CA", "Phase 1 requires Canada"),
});
export type BillingAddress = z.infer<typeof billingAddressSchema>;

export const dealLineSchema = z.object({
  productCode: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: moneySchema,
  discountPercent: z.number().min(0).max(100),
  description: z.string().min(1),
  // Our calculated line total, already verified against Salesforce's
  // TotalPrice to the cent (MAPPING.md, Decision 1).
  lineTotal: moneySchema,
}).superRefine((line, ctx) => {
  const calculated = calculateLineTotalCents(line.quantity, line.unitPrice.amountCents, line.discountPercent);
  if (!calculated.ok || calculated.value !== line.lineTotal.amountCents) {
    ctx.addIssue({ code: "custom", path: ["lineTotal"], message: "Line total must equal quantity times price after discount, rounded half up" });
  }
});
export type DealLine = z.infer<typeof dealLineSchema>;

export const dealSchema = z.object({
  salesforceOpportunityId: z.string().min(1),
  accountId: z.string().length(18),
  accountName: z.string().min(1),
  billingAddress: billingAddressSchema,
  closeDate: z.string().refine((value) => { const result = normaliseIsoDate(value); return result.ok && result.value === value; }, "Expected a valid YYYY-MM-DD calendar date"),
  currency: z.string().refine((value): boolean => value === "CAD", "Phase 1 requires CAD"),
  // The Opportunity's own pre-tax total, verified against the sum of the
  // line totals (MAPPING.md, Decision 1, Control).
  amount: moneySchema,
  lines: z.array(dealLineSchema).min(1),
}).superRefine((deal, ctx) => validateTotals(deal.currency, deal.amount, deal.lines, "amount", ctx));
export type Deal = z.infer<typeof dealSchema>;

export const customerSchema = z.object({
  salesforceAccountId: z.string().length(18),
  displayName: z.string().min(1),
  matchingKey: z.string().min(1),
  billingAddress: billingAddressSchema,
});
export type Customer = z.infer<typeof customerSchema>;

export const invoiceSchema = z.object({
  salesforceOpportunityId: z.string().min(1),
  customer: customerSchema,
  currency: z.string().refine((value): boolean => value === "CAD", "Phase 1 requires CAD"),
  lines: z.array(dealLineSchema).min(1),
  preTaxTotal: moneySchema,
}).superRefine((invoice, ctx) => validateTotals(invoice.currency, invoice.preTaxTotal, invoice.lines, "preTaxTotal", ctx));
export type Invoice = z.infer<typeof invoiceSchema>;

// Pure derivations: no tax, no customer find-or-create/lookalike matching,
// no invoice state or dates -- those are Stage 4 worker concerns
// (MAPPING.md, Decisions 3-5), documented there but not built here.

export function dealToCustomer(deal: Deal): Customer {
  return {
    salesforceAccountId: deal.accountId,
    displayName: deal.accountName,
    matchingKey: normaliseCompanyNameKey(deal.accountName),
    billingAddress: deal.billingAddress,
  };
}

export function dealToInvoice(deal: Deal, customer: Customer): Invoice {
  return {
    salesforceOpportunityId: deal.salesforceOpportunityId,
    customer,
    currency: deal.currency,
    lines: deal.lines,
    preTaxTotal: deal.amount,
  };
}

// Shared by Deal and Invoice so callers cannot bypass the financial controls.
function validateTotals(currency: string, total: Money, lines: DealLine[], totalField: string, ctx: z.RefinementCtx): void {
  if (total.currency !== currency) ctx.addIssue({ code: "custom", path: [totalField, "currency"], message: "Total currency must match document currency" });
  let sum = 0n;
  lines.forEach((line, index) => {
    for (const field of ["unitPrice", "lineTotal"] as const) {
      if (line[field].currency !== currency) ctx.addIssue({ code: "custom", path: ["lines", index, field, "currency"], message: "Line currency must match document currency" });
    }
    sum += BigInt(line.lineTotal.amountCents);
  });
  if (sum !== BigInt(total.amountCents)) ctx.addIssue({ code: "custom", path: [totalField], message: "Total must equal the sum of line totals" });
}
