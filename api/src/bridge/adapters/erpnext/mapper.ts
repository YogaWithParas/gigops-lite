import type { Customer, Invoice } from "../../domain/deal";
import { decimalFromCents } from "../../domain/money";
import type { ErpCustomerPayload, ErpSalesInvoicePayload } from "./types";

// ERPNext stores country as the full Country doctype name, not an ISO
// code. Phase 1 only has Canada (MAPPING.md, Decision 3); other countries
// are Phase 2 scope.
const ERP_COUNTRY_NAMES: Record<string, string> = {
  CA: "Canada",
};

// Maps our Customer to the ERPNext Customer create payload. No find-or-create
// or lookalike matching here -- that is the Stage 4 worker's job
// (MAPPING.md, Decision 4); this only shapes the fields for a brand-new
// Customer.
export function mapCustomerToErpPayload(customer: Customer): ErpCustomerPayload {
  return {
    customer_name: customer.displayName,
    customer_type: "Company",
    salesforce_account_id: customer.salesforceAccountId,
    customer_primary_address: {
      address_line1: customer.billingAddress.street,
      city: customer.billingAddress.city,
      state: customer.billingAddress.province,
      pincode: customer.billingAddress.postalCode,
      country: ERP_COUNTRY_NAMES[customer.billingAddress.country] ?? customer.billingAddress.country,
    },
  };
}

// Maps our Invoice to the ERPNext Sales Invoice create payload. No tax
// (Decision 3), posting/due dates, or draft/submit state here (Decision 5)
// -- the Stage 4 worker adds those using settings this mapper does not see.
// `erpCustomerId` is the ERPNext Customer id the worker already
// resolved via find-or-create.
export function mapInvoiceToErpPayload(invoice: Invoice, erpCustomerId: string): ErpSalesInvoicePayload {
  return {
    customer: erpCustomerId,
    currency: invoice.currency,
    items: invoice.lines.map((line) => ({
      item_code: line.productCode,
      qty: line.quantity,
      rate: decimalFromCents(line.unitPrice.amountCents),
      discount_percentage: line.discountPercent,
      description: line.description,
    })),
  };
}
