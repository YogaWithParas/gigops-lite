import { describe, expect, it } from "vitest";
import { hashPayload } from "../../../src/bridge/ledger/hash";

describe("hashPayload", () => {
  it("is stable regardless of key order", () => {
    const a = hashPayload({ accountId: "001", amount: 1000 });
    const b = hashPayload({ amount: 1000, accountId: "001" });
    expect(a).toBe(b);
  });

  it("is stable for nested objects and arrays regardless of key order", () => {
    const a = hashPayload({ lines: [{ qty: 1, code: "A" }], meta: { x: 1, y: 2 } });
    const b = hashPayload({ meta: { y: 2, x: 1 }, lines: [{ code: "A", qty: 1 }] });
    expect(a).toBe(b);
  });

  it("produces a different hash for a different payload", () => {
    const a = hashPayload({ accountId: "001", amount: 1000 });
    const b = hashPayload({ accountId: "001", amount: 1001 });
    expect(a).not.toBe(b);
  });

  it("returns a 64-character hex sha256 digest", () => {
    expect(hashPayload({ a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });
});
