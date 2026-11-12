import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createLedgerPool } from "../../../src/bridge/ledger/db";
import { runMigrations } from "../../../src/bridge/ledger/migrate";
import { SyncLedgerRepository } from "../../../src/bridge/ledger/repository";
import { loadBridgeSettings } from "../../../src/bridge/ledger/settings";

// Integration tests against the real bridge Postgres (docs/bridge/WORKFLOW.md,
// COMMANDS: api/docker-compose.bridge-db.yml, port 5433) -- never a mock.
// Every test uses its own randomUUID()-based idempotency key and cleans up
// only the rows it created, so this is safe to run against the shared
// long-lived dev container without truncating anyone else's data.
describe("SyncLedgerRepository", () => {
  let pool: Pool;
  let repo: SyncLedgerRepository;
  const settings = loadBridgeSettings({});
  const createdKeys: string[] = [];

  beforeAll(async () => {
    pool = createLedgerPool();
    await runMigrations(pool);
    repo = new SyncLedgerRepository(pool);
  });

  afterEach(async () => {
    if (createdKeys.length === 0) return;
    await pool.query("DELETE FROM sync_ledger WHERE idempotency_key = ANY($1)", [createdKeys]);
    createdKeys.length = 0;
  });

  afterAll(async () => {
    await pool.end();
  });

  function key(): string {
    const k = `repo-test-${randomUUID()}`;
    createdKeys.push(k);
    return k;
  }

  it("creates a new row for a brand new idempotency key", async () => {
    const idempotencyKey = key();
    const result = await repo.recordSync({
      idempotencyKey,
      sourceId: "006000000000001AAA",
      payload: { accountId: "001", amount: 1000 },
      bridgeSettings: settings,
    });

    expect(result.outcome).toBe("created");
    if (result.outcome !== "created") throw new Error("unreachable");
    expect(result.entry.idempotencyKey).toBe(idempotencyKey);
    expect(result.entry.sourceId).toBe("006000000000001AAA");
    expect(result.entry.status).toBe("pending");
    expect(result.entry.targetId).toBeNull();
    expect(result.entry.attempts).toBe(0);
    expect(result.entry.bridgeSettings).toEqual(settings);
  });

  it("returns the same row for the same key and the same payload (idempotent)", async () => {
    const idempotencyKey = key();
    const payload = { accountId: "001", amount: 1000 };

    const first = await repo.recordSync({ idempotencyKey, sourceId: "src-1", payload, bridgeSettings: settings });
    const second = await repo.recordSync({ idempotencyKey, sourceId: "src-1", payload, bridgeSettings: settings });

    expect(first.outcome).toBe("created");
    expect(second.outcome).toBe("duplicate");
    if (first.outcome === "conflict" || second.outcome === "conflict") throw new Error("unreachable");
    expect(second.entry.id).toBe(first.entry.id);

    const rows = await pool.query("SELECT count(*) FROM sync_ledger WHERE idempotency_key = $1", [idempotencyKey]);
    expect(Number(rows.rows[0].count)).toBe(1);
  });

  it("reports a conflict for the same key with a different payload, and writes nothing new", async () => {
    const idempotencyKey = key();
    const first = await repo.recordSync({
      idempotencyKey,
      sourceId: "src-1",
      payload: { amount: 1000 },
      bridgeSettings: settings,
    });
    const second = await repo.recordSync({
      idempotencyKey,
      sourceId: "src-1",
      payload: { amount: 2000 },
      bridgeSettings: settings,
    });

    expect(first.outcome).toBe("created");
    expect(second.outcome).toBe("conflict");
    if (second.outcome !== "conflict" || first.outcome === "conflict") throw new Error("unreachable");
    expect(second.existing.id).toBe(first.entry.id);
    expect(second.message).toContain(idempotencyKey);

    const rows = await pool.query("SELECT count(*) FROM sync_ledger WHERE idempotency_key = $1", [idempotencyKey]);
    expect(Number(rows.rows[0].count)).toBe(1);
  });

  it("handles concurrent duplicate inserts safely: exactly one row, every caller gets a consistent result", async () => {
    const idempotencyKey = key();
    const payload = { accountId: "concurrent", amount: 500 };

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        repo.recordSync({ idempotencyKey, sourceId: "src-concurrent", payload, bridgeSettings: settings }),
      ),
    );

    const created = results.filter((r) => r.outcome === "created");
    const duplicates = results.filter((r) => r.outcome === "duplicate");
    expect(created).toHaveLength(1);
    expect(duplicates).toHaveLength(9);

    const rows = await pool.query("SELECT count(*) FROM sync_ledger WHERE idempotency_key = $1", [idempotencyKey]);
    expect(Number(rows.rows[0].count)).toBe(1);
  });

  it("getByIdempotencyKey returns null for an unknown key", async () => {
    expect(await repo.getByIdempotencyKey(`repo-test-unknown-${randomUUID()}`)).toBeNull();
  });

  it("updateStatus transitions status, can set target id, and supports needs_review", async () => {
    const idempotencyKey = key();
    const created = await repo.recordSync({
      idempotencyKey,
      sourceId: "src-1",
      payload: { amount: 1 },
      bridgeSettings: settings,
    });
    if (created.outcome === "conflict") throw new Error("unreachable");

    const parked = await repo.updateStatus(created.entry.id, "needs_review");
    expect(parked.status).toBe("needs_review");
    expect(parked.attempts).toBe(1);

    const succeeded = await repo.updateStatus(created.entry.id, "succeeded", { targetId: "SINV-0001" });
    expect(succeeded.status).toBe("succeeded");
    expect(succeeded.targetId).toBe("SINV-0001");
    expect(succeeded.attempts).toBe(2);
  });

  it("updateStatus throws for an unknown id", async () => {
    await expect(repo.updateStatus(2 ** 31 - 1, "failed", { lastError: "boom" })).rejects.toThrow(/No sync_ledger entry/);
  });
});
