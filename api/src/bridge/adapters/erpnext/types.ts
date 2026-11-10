// ERPNext payload shapes, in ERPNext's own field names. This file -- and
// nothing outside the adapters/erpnext folder -- may describe ERPNext's
// field names. Exact field names and types are confirmed against the real
// ERPNext instance at Stage 4 (docs/bridge/SPEC.md); this is our best
// understanding of the Customer and Sales Invoice REST create payloads.

export interface ErpCustomerAddressPayload {
  address_line1: string;
  city: string;
  // ERPNext's State field, matching our 2-letter province code.
  state: string;
  pincode: string;
  country: string;
}

export interface ErpCustomerPayload {
  customer_name: string;
  customer_type: "Company";
  // The custom field created by Prateek before Stage 4
  // (MAPPING.md, "ERPNext setup needed before Stage 4").
  salesforce_account_id: string;
  customer_primary_address: ErpCustomerAddressPayload;
}

export interface ErpSalesInvoiceItemPayload {
  item_code: string;
  qty: number;
  rate: number;
  discount_percentage: number;
  description: string;
}

export interface ErpSalesInvoicePayload {
  // The ERPNext Customer's own id (its Naming Series name, e.g.
  // "CUST-00001"), resolved by the Stage 4 worker's find-or-create step --
  // not known yet at Stage 1.
  customer: string;
  currency: string;
  items: ErpSalesInvoiceItemPayload[];
}
