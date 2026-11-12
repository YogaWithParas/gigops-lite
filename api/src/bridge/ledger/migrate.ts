import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Pool } from "pg";

// Expand/contract migrations (docs/bridge/WORKFLOW.md, COMMANDS): every file
// here is additive. A future change that must drop or narrow something
// ships as a separate, later-numbered migration, never an edit to one that
// already ran. Applied migrations are tracked by filename in
// schema_migrations, so running this twice is always safe.
// __dirname (not import.meta.url: api/tsconfig.json's NodeNext module
// setting compiles this to CommonJS, where import.meta is not allowed) --
// api/src/bridge/ledger/migrate.ts -> up 3 levels is api/, where
// migrations/ lives alongside src/, the same as for the compiled
// api/dist/bridge/ledger/migrate.js.
const MIGRATIONS_DIR = join(__dirname, "..", "..", "..", "migrations");

// An arbitrary, fixed advisory-lock key for this app's migrations. Two
// processes (e.g. two test files' beforeAll, or two worker instances
// starting at once) can both call this concurrently; without the lock,
// "CREATE TABLE IF NOT EXISTS schema_migrations" itself is not race-safe --
// Postgres can raise a duplicate-key error on its own catalog when two
// sessions create the same table at the same instant. The lock serialises
// the whole migration run so only one session ever does the work.
const MIGRATION_LOCK_KEY = 727_300_001;

export async function runMigrations(pool: Pool, migrationsDir: string = MIGRATIONS_DIR): Promise<string[]> {
  const applied: string[] = [];
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id text PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      const files = readdirSync(migrationsDir)
        .filter((name) => name.endsWith(".sql"))
        .sort();

      for (const file of files) {
        const { rows } = await client.query("SELECT 1 FROM schema_migrations WHERE id = $1", [file]);
        if (rows.length > 0) continue;

        const sql = readFileSync(join(migrationsDir, file), "utf8");
        await client.query("BEGIN");
        try {
          await client.query(sql);
          await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
          await client.query("COMMIT");
          applied.push(file);
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]);
    }
  } finally {
    client.release();
  }
  return applied;
}
