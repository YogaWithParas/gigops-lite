import { describe, expect, it } from "vitest";
import { loadBridgeSettings } from "../../../src/bridge/ledger/settings";

describe("loadBridgeSettings", () => {
  it("applies the documented defaults when nothing is set", () => {
    expect(loadBridgeSettings({})).toEqual({
      timezone: "America/Vancouver",
      defaultPaymentTerms: "Net 30",
      autoSubmit: false,
      maxCloseDateAgeDays: 30,
    });
  });

  it("reads every setting from the environment when present", () => {
    expect(
      loadBridgeSettings({
        BRIDGE_TIMEZONE: "America/Toronto",
        BRIDGE_DEFAULT_PAYMENT_TERMS: "Net 15",
        BRIDGE_AUTO_SUBMIT: "true",
        BRIDGE_MAX_CLOSE_DATE_AGE_DAYS: "7",
      }),
    ).toEqual({
      timezone: "America/Toronto",
      defaultPaymentTerms: "Net 15",
      autoSubmit: true,
      maxCloseDateAgeDays: 7,
    });
  });

  it("rejects an invalid IANA time zone", () => {
    expect(() => loadBridgeSettings({ BRIDGE_TIMEZONE: "Not/A_Zone" })).toThrow(/valid IANA time zone/);
  });

  it("rejects an invalid BRIDGE_AUTO_SUBMIT value", () => {
    expect(() => loadBridgeSettings({ BRIDGE_AUTO_SUBMIT: "yes" })).toThrow(/must be "true" or "false"/);
  });

  it("rejects a zero or negative BRIDGE_MAX_CLOSE_DATE_AGE_DAYS", () => {
    expect(() => loadBridgeSettings({ BRIDGE_MAX_CLOSE_DATE_AGE_DAYS: "0" })).toThrow();
    expect(() => loadBridgeSettings({ BRIDGE_MAX_CLOSE_DATE_AGE_DAYS: "-1" })).toThrow();
  });

  it("rejects an empty BRIDGE_DEFAULT_PAYMENT_TERMS", () => {
    expect(() => loadBridgeSettings({ BRIDGE_DEFAULT_PAYMENT_TERMS: "" })).toThrow();
  });
});
