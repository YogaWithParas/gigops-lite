import { describe, expect, it } from "vitest";
import { createLedgerPool } from "../../../src/bridge/ledger/db";

describe("createLedgerPool", () => {
  it("throws a clear error when BRIDGE_DATABASE_URL is missing", () => {
    expect(() => createLedgerPool({})).toThrow(/BRIDGE_DATABASE_URL is required/);
  });

  it("builds a pool when BRIDGE_DATABASE_URL is present", () => {
    const pool = createLedgerPool({ BRIDGE_DATABASE_URL: "postgresql://user:pass@localhost:5433/db" });
    expect(pool).toBeDefined();
    return pool.end();
  });
});
