import { describe, expect, it } from "vitest";
import { dealSchema, dealToCustomer, dealToInvoice, type Deal } from "../../../src/bridge/domain/deal";

function validDeal(): Deal {
  return {
    salesforceOpportunityId: "006000000000001AAA",
    accountId: "001000000000001AAA",
    accountName: "Acme Ltd.",
    billingAddress: {
      street: "123 Main St",
      city: "Vancouver",
      province: "BC",
      postalCode: "V6X 1A1",
      country: "CA",
    },
    closeDate: "2026-11-07",
    currency: "CAD",
    amount: { amountCents: 125000, currency: "CAD" },
    lines: [
      {
        productCode: "WIDGET-01",
        quantity: 2,
        unitPrice: { amountCents: 62500, currency: "CAD" },
        discountPercent: 0,
        description: "Widget",
        lineTotal: { amountCents: 125000, currency: "CAD" },
      },
    ],
  };
}

describe("dealSchema", () => {
  it("accepts a well-formed deal", () => {
    expect(dealSchema.safeParse(validDeal()).success).toBe(true);
  });

  it("rejects a deal with no lines", () => {
    const deal = { ...validDeal(), lines: [] };
    expect(dealSchema.safeParse(deal).success).toBe(false);
  });

  it("rejects an account id that is not 18 characters", () => {
    const deal = { ...validDeal(), accountId: "tooshort" };
    expect(dealSchema.safeParse(deal).success).toBe(false);
  });

  it("rejects a lowercase currency code", () => {
    const deal = { ...validDeal(), currency: "cad" };
    expect(dealSchema.safeParse(deal).success).toBe(false);
  });
});

describe("dealToCustomer", () => {
  it("derives the customer's matching key from the account name", () => {
    const customer = dealToCustomer(validDeal());
    expect(customer).toEqual({
      salesforceAccountId: "001000000000001AAA",
      displayName: "Acme Ltd.",
      matchingKey: "acme",
      billingAddress: validDeal().billingAddress,
    });
  });
});

describe("dealToInvoice", () => {
  it("carries the deal's lines and pre-tax total, keyed to the customer", () => {
    const deal = validDeal();
    const customer = dealToCustomer(deal);
    const invoice = dealToInvoice(deal, customer);
    expect(invoice).toEqual({
      salesforceOpportunityId: deal.salesforceOpportunityId,
      customer,
      currency: "CAD",
      lines: deal.lines,
      preTaxTotal: deal.amount,
    });
  });
});

import { customerSchema, invoiceSchema } from "../../../src/bridge/domain/deal";

it.each(["2026-02-30", "2026-13-01"])("rejects impossible date %s", (closeDate) => {
  expect(dealSchema.safeParse({ ...validDeal(), closeDate }).success).toBe(false);
});
it.each([{ province: "ZZ" }, { postalCode: "invalid" }, { country: "US" }])("rejects invalid addresses at every domain boundary", (bad) => {
  const deal = validDeal(); deal.billingAddress = { ...deal.billingAddress, ...bad };
  const customer = dealToCustomer(deal);
  expect(dealSchema.safeParse(deal).success).toBe(false);
  expect(customerSchema.safeParse(customer).success).toBe(false);
  expect(invoiceSchema.safeParse(dealToInvoice(deal, customer)).success).toBe(false);
});
it.each(["amount", "unitPrice", "lineTotal", "sum", "lineCalculation"])("rejects inconsistent %s in deals and invoices", (field) => {
  const deal = validDeal();
  if (field === "amount") deal.amount.currency = "USD";
  if (field === "unitPrice") deal.lines[0].unitPrice.currency = "EUR";
  if (field === "lineTotal") deal.lines[0].lineTotal.currency = "JPY";
  if (field === "sum") deal.amount.amountCents++;
  if (field === "lineCalculation") deal.lines[0].quantity++;
  expect(dealSchema.safeParse(deal).success).toBe(false);
  expect(invoiceSchema.safeParse(dealToInvoice(deal, dealToCustomer(deal))).success).toBe(false);
});
it("accepts a valid customer and invoice", () => {
  const deal = validDeal(); const customer = dealToCustomer(deal);
  expect(customerSchema.safeParse(customer).success).toBe(true);
  expect(invoiceSchema.safeParse(dealToInvoice(deal, customer)).success).toBe(true);
});
