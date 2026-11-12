import { randomUUID } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createLedgerPool } from "../../../src/bridge/ledger/db";
import { runMigrations } from "../../../src/bridge/ledger/migrate";

describe("runMigrations", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = createLedgerPool();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates the sync_ledger table and is safe to run twice", async () => {
    // Don't assume this is the first time ever against this database --
    // another test file's beforeAll may have already applied it. Only
    // assert what must hold regardless of ordering: migrations converge,
    // and a run right after another run is always a no-op.
    await runMigrations(pool);
    const secondRun = await runMigrations(pool);
    expect(secondRun).toEqual([]);

    const recorded = await pool.query("SELECT 1 FROM schema_migrations WHERE id = $1", ["0001_create_sync_ledger.sql"]);
    expect(recorded.rows).toHaveLength(1);

    const probeKey = `migrate-test-${randomUUID()}`;
    await pool.query(
      `INSERT INTO sync_ledger (idempotency_key, source_id, status, payload_hash, bridge_settings)
       VALUES ($1, 'probe', 'pending', 'hash', '{}'::jsonb)`,
      [probeKey],
    );
    try {
      const { rows } = await pool.query("SELECT status FROM sync_ledger WHERE idempotency_key = $1", [probeKey]);
      expect(rows[0].status).toBe("pending");
    } finally {
      await pool.query("DELETE FROM sync_ledger WHERE idempotency_key = $1", [probeKey]);
    }
  });

  it("applies a brand new migration file and records it", async () => {
    const dir = mkdtempSync(join(tmpdir(), "bridge-migrations-"));
    const tableName = `migrate_probe_${randomUUID().replace(/-/g, "_")}`;
    writeFileSync(join(dir, "0001_probe.sql"), `CREATE TABLE ${tableName} (id int)`);

    try {
      const applied = await runMigrations(pool, dir);
      expect(applied).toEqual(["0001_probe.sql"]);

      const again = await runMigrations(pool, dir);
      expect(again).toEqual([]);

      const { rows } = await pool.query("SELECT to_regclass($1) AS reg", [tableName]);
      expect(rows[0].reg).toBe(tableName);
    } finally {
      await pool.query(`DROP TABLE IF EXISTS ${tableName}`);
      await pool.query("DELETE FROM schema_migrations WHERE id = $1", ["0001_probe.sql"]);
    }
  });

  it("rolls back and rethrows, without recording it, when a migration file fails", async () => {
    const dir = mkdtempSync(join(tmpdir(), "bridge-migrations-"));
    writeFileSync(join(dir, "0001_broken.sql"), "THIS IS NOT VALID SQL;");

    await expect(runMigrations(pool, dir)).rejects.toThrow();

    const { rows } = await pool.query("SELECT 1 FROM schema_migrations WHERE id = $1", ["0001_broken.sql"]);
    expect(rows).toHaveLength(0);
  });

  it("rejects a status outside the documented set", async () => {
    await expect(
      pool.query(
        `INSERT INTO sync_ledger (idempotency_key, source_id, status, payload_hash, bridge_settings)
         VALUES ($1, 'probe', 'not_a_real_status', 'hash', '{}'::jsonb)`,
        [`migrate-test-${randomUUID()}`],
      ),
    ).rejects.toThrow();
  });
});
