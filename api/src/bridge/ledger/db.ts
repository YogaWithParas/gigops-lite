import { Pool } from "pg";

// Stage 2 (docs/bridge/SPEC.md): one pool, built from the bridge's own
// Postgres connection string -- never the ERPNext or GigOps database.
export function createLedgerPool(env: NodeJS.ProcessEnv = process.env): Pool {
  if (!env.BRIDGE_DATABASE_URL) {
    throw new Error("BRIDGE_DATABASE_URL is required (see api/.env.example)");
  }
  return new Pool({ connectionString: env.BRIDGE_DATABASE_URL });
}
