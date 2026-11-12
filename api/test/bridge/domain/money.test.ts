import { describe, expect, it } from "vitest";
import { centsFromDecimal, decimalFromCents, normaliseCurrencyCode } from "../../../src/bridge/domain/money";

describe("centsFromDecimal", () => {
  it("converts a decimal dollar amount to integer cents", () => {
    const result = centsFromDecimal(1250.5);
    expect(result).toEqual({ ok: true, value: 125050 });
  });

  it("accepts a plain whole number", () => {
    expect(centsFromDecimal(10)).toEqual({ ok: true, value: 1000 });
  });

  it("accepts a string amount", () => {
    expect(centsFromDecimal("19.99")).toEqual({ ok: true, value: 1999 });
  });

  it("pads a single decimal digit", () => {
    expect(centsFromDecimal("4.5")).toEqual({ ok: true, value: 450 });
  });

  it("preserves a negative sign", () => {
    expect(centsFromDecimal("-19.99")).toEqual({ ok: true, value: -1999 });
  });

  it("rejects more than two decimal places with a clear message", () => {
    const result = centsFromDecimal("10.555");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/not a valid decimal amount/);
      expect(result.errors[0]).toContain("10.555");
    }
  });

  it("rejects a non-numeric value", () => {
    const result = centsFromDecimal("ten dollars");
    expect(result.ok).toBe(false);
  });
});

describe("decimalFromCents", () => {
  it("converts integer cents back to a decimal dollar amount", () => {
    expect(decimalFromCents(125050)).toBe(1250.5);
  });

  it("pads a single-digit cent amount", () => {
    expect(decimalFromCents(1005)).toBe(10.05);
  });

  it("preserves a negative sign", () => {
    expect(decimalFromCents(-1999)).toBe(-19.99);
  });

  it("round-trips with centsFromDecimal", () => {
    const result = centsFromDecimal("1250.50");
    expect(result.ok).toBe(true);
    if (result.ok) expect(decimalFromCents(result.value)).toBe(1250.5);
  });
});

describe("normaliseCurrencyCode", () => {
  it("uppercases a lowercase ISO code", () => {
    expect(normaliseCurrencyCode("cad")).toEqual({ ok: true, value: "CAD" });
  });

  it("passes through an already-correct code", () => {
    expect(normaliseCurrencyCode("CAD")).toEqual({ ok: true, value: "CAD" });
  });

  it("trims surrounding whitespace", () => {
    expect(normaliseCurrencyCode("  cad  ")).toEqual({ ok: true, value: "CAD" });
  });

  it("maps the C$ symbol to CAD", () => {
    expect(normaliseCurrencyCode("C$")).toEqual({ ok: true, value: "CAD" });
  });

  it("rejects an unrecognised currency with a clear message", () => {
    const result = normaliseCurrencyCode("dollars");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatch(/Unrecognised currency/);
    }
  });
});

import { calculateLineTotalCents } from "../../../src/bridge/domain/money";

describe("exact line totals", () => {
  it.each([[1, 5, 90, 1], [0.1, 5, 0, 1], [1, 100, 12.5, 88], [1e-7, 5000000, 0, 1], [1, 100, 100, 0]])("rounds %s x %s at %s percent", (q, p, d, total) => {
    expect(calculateLineTotalCents(q, p, d)).toEqual({ ok: true, value: total });
  });
  it.each([[Infinity, 1, 0], [1, -1, 0], [1, 1, NaN], [1, 1, 101], [Number.MAX_VALUE, 100, 0]])("rejects invalid or unsafe arithmetic", (q, p, d) => {
    expect(calculateLineTotalCents(q, p, d).ok).toBe(false);
  });
});

it("converts the safe integer boundary exactly and rejects overflow", () => {
  expect(centsFromDecimal("90071992547409.91")).toEqual({ ok: true, value: Number.MAX_SAFE_INTEGER });
  expect(centsFromDecimal("90071992547409.92").ok).toBe(false);
  expect(centsFromDecimal("9007199254740993.01").ok).toBe(false);
});
