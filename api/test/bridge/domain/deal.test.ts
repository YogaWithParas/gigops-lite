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
