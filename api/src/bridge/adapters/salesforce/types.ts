// Raw Salesforce shapes, exactly as they arrive from Apex (see
// docs/bridge/SPEC.md Stage 5). This file -- and nothing outside the
// adapters/salesforce folder -- may describe Salesforce's own field names.

export interface RawSalesforceBillingAddress {
  street?: string;
  city?: string;
  // Salesforce's State and Country/Territory Picklists field for the
  // billing province (MAPPING.md, "Salesforce setup needed before Stage 5").
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface RawSalesforceAccount {
  Id?: string;
  Name?: string;
  BillingAddress?: RawSalesforceBillingAddress;
}

export interface RawSalesforceOpportunityLineItem {
  ProductCode?: string;
  // Product2.Name, used as the description fallback (MAPPING.md, Decision 1).
  ProductName?: string;
  Quantity?: number;
  UnitPrice?: number;
  Discount?: number;
  Description?: string;
  TotalPrice?: number;
}

export interface RawSalesforceOpportunity {
  Id?: string;
  AccountId?: string;
  Amount?: number;
  CloseDate?: string;
  CurrencyIsoCode?: string;
}
