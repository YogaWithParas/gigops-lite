import { z } from "zod";
import { moneySchema } from "./money";
import { normaliseCompanyNameKey } from "./normalise";

// Our own Deal, Customer and Invoice types (docs/bridge/SPEC.md, Stage 1).
// No Salesforce or ERPNext types are used here -- only the adapter folders
// may import those.

export const billingAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  province: z.string().regex(/^[A-Z]{2}$/),
  postalCode: z.string().min(1),
  country: z.string().regex(/^[A-Z]{2}$/),
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
});
export type DealLine = z.infer<typeof dealLineSchema>;

export const dealSchema = z.object({
  salesforceOpportunityId: z.string().min(1),
  accountId: z.string().length(18),
  accountName: z.string().min(1),
  billingAddress: billingAddressSchema,
  closeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().regex(/^[A-Z]{3}$/),
  // The Opportunity's own pre-tax total, verified against the sum of the
  // line totals (MAPPING.md, Decision 1, Control).
  amount: moneySchema,
  lines: z.array(dealLineSchema).min(1),
});
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
  currency: z.string().regex(/^[A-Z]{3}$/),
  lines: z.array(dealLineSchema).min(1),
  preTaxTotal: moneySchema,
});
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
