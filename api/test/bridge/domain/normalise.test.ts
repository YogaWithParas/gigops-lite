import { describe, expect, it } from "vitest";
import {
  normaliseCompanyNameDisplay,
  normaliseCompanyNameKey,
  normaliseCountry,
  normaliseIsoDate,
  normalisePostalCode,
  normaliseProductCode,
  normaliseProvince,
} from "../../../src/bridge/domain/normalise";

describe("normaliseProvince", () => {
  it.each([
    ["B.C.", "BC"],
    ["bc", "BC"],
    ["British Columbia", "BC"],
    ["ON", "ON"],
    ["ontario", "ON"],
    ["Quebec", "QC"],
    ["Prince Edward Island", "PE"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normaliseProvince(input)).toEqual({ ok: true, value: expected });
  });

  it("rejects an unrecognised province with a clear message", () => {
    const result = normaliseProvince("Atlantis");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/Unrecognised province/);
  });
});

describe("normaliseCountry", () => {
  it.each([
    ["Canada", "CA"],
    ["CAN", "CA"],
    ["ca", "CA"],
    ["CA", "CA"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normaliseCountry(input)).toEqual({ ok: true, value: expected });
  });

  it("rejects a country Phase 1 does not support", () => {
    const result = normaliseCountry("France");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/France/);
  });
});

describe("normalisePostalCode", () => {
  it.each([
    ["v6x1a1", "V6X 1A1"],
    ["V6X-1A1", "V6X 1A1"],
    ["V6X 1A1", "V6X 1A1"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normalisePostalCode(input)).toEqual({ ok: true, value: expected });
  });

  it("rejects a postal code that is not a valid Canadian format", () => {
    const result = normalisePostalCode("90210");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/not a valid Canadian postal code/);
  });
});

describe("company name normalisation", () => {
  it.each([
    [" ACME Limited.", "acme"],
    ["Acme Ltd", "acme"],
    ["Acme Inc.", "acme"],
    ["Acme Corp", "acme"],
  ])("normalises the matching key for %s to %s", (input, expected) => {
    expect(normaliseCompanyNameKey(input)).toBe(expected);
  });

  it("trims only extra spaces for the display value", () => {
    expect(normaliseCompanyNameDisplay("  Acme   Ltd. ")).toBe("Acme Ltd.");
  });
});

describe("normaliseProductCode", () => {
  it("trims surrounding spaces but changes nothing else", () => {
    expect(normaliseProductCode(" WIDGET-01 ")).toEqual({ ok: true, value: "WIDGET-01" });
  });

  it("rejects an empty product code", () => {
    const result = normaliseProductCode("   ");
    expect(result.ok).toBe(false);
  });
});

describe("normaliseIsoDate", () => {
  it("passes through a well-formed date", () => {
    expect(normaliseIsoDate("2026-11-07")).toEqual({ ok: true, value: "2026-11-07" });
  });

  it("rejects a value that is not YYYY-MM-DD", () => {
    const result = normaliseIsoDate("11/07/2026");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/YYYY-MM-DD/);
  });

  it("rejects a calendar date that does not exist", () => {
    const result = normaliseIsoDate("2026-02-30");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/not a valid calendar date/);
  });
});
