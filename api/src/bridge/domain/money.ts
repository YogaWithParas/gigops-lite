import { z } from "zod";
import { err, ok, type Result } from "./result";

// Money is always an integer number of minor units (cents) plus an ISO 4217
// currency code -- never a float, never a bare number. See
// docs/bridge/MAPPING.md, Decision 2.
export const moneySchema = z.object({
  amountCents: z.number().int(),
  currency: z.string().regex(/^[A-Z]{3}$/),
});
export type Money = z.infer<typeof moneySchema>;

const DECIMAL_AMOUNT_PATTERN = /^(-?)(\d+)(?:\.(\d{1,2}))?$/;

// Converts a decimal dollar amount (e.g. 1250.5 or "19.99") to integer cents.
// Parses the input as text rather than doing floating-point math, so a value
// like 1250.50 always becomes exactly 125050.
export function centsFromDecimal(value: number | string): Result<number> {
  const raw = (typeof value === "number" ? value.toString() : value).trim();
  const match = DECIMAL_AMOUNT_PATTERN.exec(raw);
  if (!match) {
    return err(`Money amount "${value}" is not a valid decimal amount with up to 2 decimal places`);
  }

  const [, sign, whole, fraction = ""] = match;
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return ok(sign === "-" ? -cents : cents);
}

const CURRENCY_ALIASES: Record<string, string> = {
  "C$": "CAD",
};

// Normalises a currency value (e.g. "cad", "C$") to its ISO 4217 code (e.g.
// "CAD"). Phase 1 only accepts CAD deals; that check happens where the
// currency is known to be the deal's currency, not here -- this function is
// kept generic so Phase 2 (MAPPING.md) does not need to change it.
export function normaliseCurrencyCode(raw: string): Result<string> {
  const upper = raw.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(upper)) {
    return ok(upper);
  }

  const alias = CURRENCY_ALIASES[upper];
  if (alias) {
    return ok(alias);
  }

  return err(`Unrecognised currency: "${raw}"`);
}

// The inverse of centsFromDecimal: ERPNext's APIs expect decimal major
// units (e.g. 1250.5), not cents. Built from integer arithmetic plus a
// string join, never a float division, so 125050 always becomes exactly
// 1250.5.
export function decimalFromCents(cents: number): number {
  const sign = cents < 0 ? "-" : "";
  const absoluteCents = Math.abs(cents);
  const whole = Math.floor(absoluteCents / 100);
  const fraction = (absoluteCents % 100).toString().padStart(2, "0");
  return Number(`${sign}${whole}.${fraction}`);
}
