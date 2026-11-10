import { describe, expect, it } from "vitest";
import { mapCustomerToErpPayload, mapInvoiceToErpPayload } from "../../../src/bridge/adapters/erpnext/mapper";
import { dealToCustomer, dealToInvoice, type Deal } from "../../../src/bridge/domain/deal";

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
        discountPercent: 10,
        description: "Widget",
        lineTotal: { amountCents: 112500, currency: "CAD" },
      },
    ],
  };
}

describe("mapCustomerToErpPayload", () => {
  it("shapes the ERPNext Customer create payload", () => {
    const customer = dealToCustomer(validDeal());
    expect(mapCustomerToErpPayload(customer)).toEqual({
      customer_name: "Acme Ltd.",
      customer_type: "Company",
      salesforce_account_id: "001000000000001AAA",
      customer_primary_address: {
        address_line1: "123 Main St",
        city: "Vancouver",
        state: "BC",
        pincode: "V6X 1A1",
        country: "Canada",
      },
    });
  });

  it("falls back to the raw country code when it has no ERPNext country name mapped yet", () => {
    const customer = dealToCustomer(validDeal());
    const result = mapCustomerToErpPayload({
      ...customer,
      billingAddress: { ...customer.billingAddress, country: "US" },
    });
    expect(result.customer_primary_address.country).toBe("US");
  });
});

describe("mapInvoiceToErpPayload", () => {
  it("converts cents back to decimal rate and carries the resolved ERPNext customer id", () => {
    const deal = validDeal();
    const invoice = dealToInvoice(deal, dealToCustomer(deal));

    expect(mapInvoiceToErpPayload(invoice, "CUST-00001")).toEqual({
      customer: "CUST-00001",
      currency: "CAD",
      items: [
        {
          item_code: "WIDGET-01",
          qty: 2,
          rate: 625,
          discount_percentage: 10,
          description: "Widget",
        },
      ],
    });
  });
});
