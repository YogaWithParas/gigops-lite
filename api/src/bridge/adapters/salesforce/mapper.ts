import { dealSchema, type Deal, type DealLine } from "../../domain/deal";
import { centsFromDecimal, normaliseCurrencyCode } from "../../domain/money";
import {
  collapseWhitespace,
  normaliseCountry,
  normaliseIsoDate,
  normalisePostalCode,
  normaliseProductCode,
  normaliseProvince,
} from "../../domain/normalise";
import { err, ok, type Result } from "../../domain/result";
import type { RawSalesforceAccount, RawSalesforceOpportunity, RawSalesforceOpportunityLineItem } from "./types";

// Maps a raw Salesforce Opportunity + Account + line items to our own Deal
// type (docs/bridge/SPEC.md, Stage 1). Collects every problem with the
// input and returns them all together, rather than stopping at the first
// one (MAPPING.md, "Validation reports every problem in one message").
export function mapOpportunityToDeal(
  opportunity: RawSalesforceOpportunity,
  account: RawSalesforceAccount,
  lineItems: RawSalesforceOpportunityLineItem[],
): Result<Deal> {
  const errors: string[] = [];

  if (!opportunity.Id) errors.push("Missing: Opportunity Id");
  if (!opportunity.AccountId) errors.push("Missing: Opportunity AccountId");
  if (!account.Id) errors.push("Missing: Account Id");
  else if (account.Id.length !== 18) errors.push(`Account Id must be 18 characters (got "${account.Id}")`);
  if (!account.Name) errors.push("Missing: Account Name");

  let closeDate: string | undefined;
  if (!opportunity.CloseDate) {
    errors.push("Missing: Opportunity CloseDate");
  } else {
    const result = normaliseIsoDate(opportunity.CloseDate);
    if (result.ok) closeDate = result.value;
    else errors.push(...result.errors);
  }

  let currency: string | undefined;
  if (!opportunity.CurrencyIsoCode) {
    errors.push("Missing: Opportunity CurrencyIsoCode");
  } else {
    const result = normaliseCurrencyCode(opportunity.CurrencyIsoCode);
    if (!result.ok) errors.push(...result.errors);
    else if (result.value !== "CAD") errors.push(`Deal currency must be CAD (got "${result.value}")`);
    else currency = result.value;
  }

  let amountCents: number | undefined;
  if (opportunity.Amount === undefined) {
    errors.push("Missing: Opportunity Amount");
  } else {
    const result = centsFromDecimal(opportunity.Amount);
    if (result.ok) amountCents = result.value;
    else errors.push(...result.errors);
  }

  const billing = account.BillingAddress;

  let province: string | undefined;
  if (!billing?.state) {
    errors.push("Missing: Account BillingAddress province");
  } else {
    const result = normaliseProvince(billing.state);
    if (result.ok) province = result.value;
    else errors.push(...result.errors);
  }

  let postalCode: string | undefined;
  if (!billing?.postalCode) {
    errors.push("Missing: Account BillingAddress postal code");
  } else {
    const result = normalisePostalCode(billing.postalCode);
    if (result.ok) postalCode = result.value;
    else errors.push(...result.errors);
  }

  let country: string | undefined;
  if (!billing?.country) {
    errors.push("Missing: Account BillingAddress country");
  } else {
    const result = normaliseCountry(billing.country);
    if (result.ok) country = result.value;
    else errors.push(...result.errors);
  }

  if (!billing?.street) errors.push("Missing: Account BillingAddress street");
  if (!billing?.city) errors.push("Missing: Account BillingAddress city");

  if (lineItems.length === 0) {
    errors.push("Opportunity has no products");
  }

  const lines: DealLine[] = [];
  let lineTotalSumCents = 0;

  for (const item of lineItems) {
    const label = item.ProductCode ? item.ProductCode.trim() : "(missing product code)";

    let productCode: string | undefined;
    if (!item.ProductCode) {
      errors.push("Missing: product code for an opportunity line");
    } else {
      const result = normaliseProductCode(item.ProductCode);
      if (result.ok) productCode = result.value;
      else errors.push(...result.errors);
    }

    if (item.Quantity === undefined || item.Quantity <= 0) {
      errors.push(`Product ${label} must have a quantity greater than 0`);
    }

    let unitPriceCents: number | undefined;
    if (item.UnitPrice === undefined) {
      errors.push(`Product ${label} has no unit price`);
    } else {
      const result = centsFromDecimal(item.UnitPrice);
      if (result.ok) unitPriceCents = result.value;
      else errors.push(...result.errors);
    }

    const discountPercent = item.Discount ?? 0;
    if (discountPercent < 0 || discountPercent > 100) {
      errors.push(`Product ${label} has an invalid discount percentage (${discountPercent})`);
    }

    const description = collapseWhitespace(item.Description || item.ProductName || "");
    if (description === "") {
      errors.push(`Product ${label} has no description and no product name to use as a fallback`);
    }

    if (item.TotalPrice === undefined) {
      errors.push(`Product ${label} is missing a TotalPrice to verify against`);
    }

    const lineIsUsable =
      productCode !== undefined &&
      unitPriceCents !== undefined &&
      item.Quantity !== undefined &&
      item.Quantity > 0 &&
      discountPercent >= 0 &&
      discountPercent <= 100 &&
      description !== "" &&
      item.TotalPrice !== undefined;

    if (!lineIsUsable) {
      continue; // already reported above; cannot build or verify this line
    }

    const lineTotalCents = Math.round(item.Quantity! * unitPriceCents! * (1 - discountPercent / 100));
    const reportedTotal = centsFromDecimal(item.TotalPrice!);
    if (!reportedTotal.ok) {
      errors.push(...reportedTotal.errors);
      continue;
    }
    if (lineTotalCents !== reportedTotal.value) {
      errors.push(
        `Line total for product ${productCode} (${lineTotalCents} cents) does not match Salesforce TotalPrice (${reportedTotal.value} cents)`,
      );
      continue;
    }

    lineTotalSumCents += lineTotalCents;
    lines.push({
      productCode: productCode!,
      quantity: item.Quantity!,
      unitPrice: { amountCents: unitPriceCents!, currency: currency ?? "CAD" },
      discountPercent,
      description,
      lineTotal: { amountCents: lineTotalCents, currency: currency ?? "CAD" },
    });
  }

  if (errors.length === 0 && amountCents !== undefined && lineTotalSumCents !== amountCents) {
    errors.push(
      `Sum of line totals (${lineTotalSumCents} cents) does not match Opportunity Amount (${amountCents} cents)`,
    );
  }

  if (errors.length > 0) {
    return err(...errors);
  }

  const deal: Deal = {
    salesforceOpportunityId: opportunity.Id!,
    accountId: account.Id!,
    accountName: collapseWhitespace(account.Name!),
    billingAddress: {
      street: collapseWhitespace(billing!.street!),
      city: collapseWhitespace(billing!.city!),
      province: province!,
      postalCode: postalCode!,
      country: country!,
    },
    closeDate: closeDate!,
    currency: currency!,
    amount: { amountCents: amountCents!, currency: currency! },
    lines,
  };

  const parsed = dealSchema.safeParse(deal);
  if (!parsed.success) {
    return err(...parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
  }

  return ok(parsed.data);
}
