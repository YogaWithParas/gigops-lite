import { describe, expect, it } from "vitest";
import { mapOpportunityToDeal } from "../../../src/bridge/adapters/salesforce/mapper";
import type {
  RawSalesforceAccount,
  RawSalesforceOpportunity,
  RawSalesforceOpportunityLineItem,
} from "../../../src/bridge/adapters/salesforce/types";

function validOpportunity(): RawSalesforceOpportunity {
  return {
    Id: "006000000000001AAA",
    AccountId: "001000000000001AAA",
    Amount: 1250,
    CloseDate: "2026-11-07",
    CurrencyIsoCode: "CAD",
  };
}

function validAccount(): RawSalesforceAccount {
  return {
    Id: "001000000000001AAA",
    Name: "Acme Ltd.",
    BillingAddress: {
      street: "123 Main St",
      city: "Vancouver",
      state: "BC",
      postalCode: "V6X 1A1",
      country: "CA",
    },
  };
}

function validLineItems(): RawSalesforceOpportunityLineItem[] {
  return [
    {
      ProductCode: "WIDGET-01",
      ProductName: "Widget",
      Quantity: 2,
      UnitPrice: 625,
      Discount: 0,
      Description: "Widget",
      TotalPrice: 1250,
    },
  ];
}

describe("mapOpportunityToDeal", () => {
  it("maps a well-formed opportunity to a Deal", () => {
    const result = mapOpportunityToDeal(validOpportunity(), validAccount(), validLineItems());
    expect(result).toEqual({
      ok: true,
      value: {
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
      },
    });
  });

  it("normalises messy province, postal code and currency values", () => {
    const account: RawSalesforceAccount = {
      ...validAccount(),
      BillingAddress: { street: "123 Main St", city: "Vancouver", state: "bc", postalCode: "v6x1a1", country: "Canada" },
    };
    const opportunity: RawSalesforceOpportunity = { ...validOpportunity(), CurrencyIsoCode: "cad" };

    const result = mapOpportunityToDeal(opportunity, account, validLineItems());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.billingAddress.province).toBe("BC");
      expect(result.value.billingAddress.postalCode).toBe("V6X 1A1");
      expect(result.value.currency).toBe("CAD");
    }
  });

  it("applies a line discount when computing the line total", () => {
    const lineItems: RawSalesforceOpportunityLineItem[] = [
      {
        ProductCode: "WIDGET-02",
        Quantity: 3,
        UnitPrice: 100,
        Discount: 10,
        Description: "Discounted widget",
        TotalPrice: 270,
      },
    ];
    const opportunity: RawSalesforceOpportunity = { ...validOpportunity(), Amount: 270 };

    const result = mapOpportunityToDeal(opportunity, validAccount(), lineItems);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.lines[0].lineTotal).toEqual({ amountCents: 27000, currency: "CAD" });
    }
  });

  it("falls back to the product name when the line has no description", () => {
    const lineItems: RawSalesforceOpportunityLineItem[] = [
      { ProductCode: "WIDGET-01", ProductName: "Widget", Quantity: 2, UnitPrice: 625, TotalPrice: 1250 },
    ];
    const result = mapOpportunityToDeal(validOpportunity(), validAccount(), lineItems);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.lines[0].description).toBe("Widget");
    }
  });

  it("rejects an opportunity with no products", () => {
    const result = mapOpportunityToDeal(validOpportunity(), validAccount(), []);
    expect(result).toEqual({ ok: false, errors: ["Opportunity has no products"] });
  });

  it("rejects a non-CAD currency", () => {
    const opportunity: RawSalesforceOpportunity = { ...validOpportunity(), CurrencyIsoCode: "USD" };
    const result = mapOpportunityToDeal(opportunity, validAccount(), validLineItems());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain('Deal currency must be CAD (got "USD")');
    }
  });

  it("rejects a line whose total does not match Salesforce's TotalPrice", () => {
    const lineItems: RawSalesforceOpportunityLineItem[] = [
      { ProductCode: "WIDGET-01", Quantity: 2, UnitPrice: 625, Description: "Widget", TotalPrice: 999 },
    ];
    const result = mapOpportunityToDeal(validOpportunity(), validAccount(), lineItems);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/does not match Salesforce TotalPrice/);
    }
  });

  it("rejects when the sum of line totals does not match the Opportunity Amount", () => {
    const opportunity: RawSalesforceOpportunity = { ...validOpportunity(), Amount: 9999 };
    const result = mapOpportunityToDeal(opportunity, validAccount(), validLineItems());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/does not match Opportunity Amount/);
    }
  });

  it("reports every missing required field together, not one at a time", () => {
    const opportunity: RawSalesforceOpportunity = {};
    const account: RawSalesforceAccount = {};
    const result = mapOpportunityToDeal(opportunity, account, []);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain("Missing: Opportunity Id");
      expect(result.errors).toContain("Missing: Account Id");
      expect(result.errors).toContain("Missing: Account Name");
      expect(result.errors).toContain("Missing: Opportunity CloseDate");
      expect(result.errors).toContain("Missing: Opportunity CurrencyIsoCode");
      expect(result.errors).toContain("Missing: Opportunity Amount");
      expect(result.errors).toContain("Missing: Account BillingAddress province");
      expect(result.errors).toContain("Missing: Account BillingAddress postal code");
      expect(result.errors).toContain("Missing: Account BillingAddress country");
      expect(result.errors).toContain("Missing: Account BillingAddress street");
      expect(result.errors).toContain("Missing: Account BillingAddress city");
      expect(result.errors).toContain("Opportunity has no products");
      expect(result.errors.length).toBeGreaterThan(5);
    }
  });

  it("rejects an account id that is not 18 characters", () => {
    const account: RawSalesforceAccount = { ...validAccount(), Id: "tooshort" };
    const result = mapOpportunityToDeal(validOpportunity(), account, validLineItems());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/must be 18 characters/);
    }
  });
});
